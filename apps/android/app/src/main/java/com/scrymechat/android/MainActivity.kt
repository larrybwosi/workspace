package com.scrymechat.android

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.activity.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.compose.rememberNavController
import com.scrymechat.android.data.local.SessionManager
import com.scrymechat.android.data.remote.RealtimeService
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import com.scrymechat.android.ui.login.LoginViewModel
import com.scrymechat.android.ui.navigation.ScrymeNavHost
import com.scrymechat.android.ui.navigation.Screen
import com.scrymechat.android.ui.theme.ScrymechatTheme
import com.scrymechat.android.ui.theme.ThemeViewModel
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.combine

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @javax.inject.Inject
    lateinit var sessionManager: SessionManager

    @javax.inject.Inject
    lateinit var shareManager: com.scrymechat.android.data.local.ShareManager

    private val loginViewModel: LoginViewModel by viewModels()
    private val themeViewModel: ThemeViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val themePreference by themeViewModel.themePreference.collectAsState()

            ScrymechatTheme(themePreference = themePreference) {
                val navController = rememberNavController()

                // Request notification permission for Android 13+
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    val launcher = rememberLauncherForActivityResult(
                        ActivityResultContracts.RequestPermission()
                    ) { isGranted ->
                        // Handle permission result if needed
                    }

                    LaunchedEffect(Unit) {
                        if (ContextCompat.checkSelfPermission(
                                this@MainActivity,
                                Manifest.permission.POST_NOTIFICATIONS
                            ) != PackageManager.PERMISSION_GRANTED
                        ) {
                            launcher.launch(Manifest.permission.POST_NOTIFICATIONS)
                        }
                    }
                }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    ScrymeNavHost(
                        navController = navController,
                        sessionManager = sessionManager
                    )
                }

                LaunchedEffect(Unit) {
                    var lastSessionId: String? = null
                    var lastApiUrl: String? = null

                    combine(
                        sessionManager.getActiveSessionFlow(),
                        sessionManager.getApiUrlFlow()
                    ) { session, apiUrl -> session to apiUrl }
                        .collectLatest { (session, apiUrl) ->
                            if (session != null) {
                                if (session.id != lastSessionId || apiUrl != lastApiUrl) {
                                    lastSessionId = session.id
                                    lastApiUrl = apiUrl
                                    stopService(Intent(this@MainActivity, RealtimeService::class.java))
                                    startRealtimeService()
                                }
                            } else {
                                if (lastSessionId != null) {
                                    lastSessionId = null
                                    lastApiUrl = apiUrl
                                    stopService(Intent(this@MainActivity, RealtimeService::class.java))
                                }
                            }
                        }
                }

                LaunchedEffect(intent) {
                    handleIntent(intent, { route ->
                        navController.navigate(route)
                    })
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }

    private fun startRealtimeService() {
        val serviceIntent = Intent(this, RealtimeService::class.java)
        startService(serviceIntent)
    }

    private fun handleIntent(intent: Intent, navigate: (String) -> Unit) {
        // Parse Deep Links
        if (intent.action == Intent.ACTION_VIEW) {
            intent.data?.let { uri ->
                if (uri.scheme == "scrymechat" && uri.host == "auth") {
                    loginViewModel.handleGitHubRedirect(uri)
                } else if (uri.host == "chat.scryme.tech") {
                    val pathSegments = uri.pathSegments
                    val route = if (pathSegments.size >= 3 && pathSegments[0] == "channels") {
                        val workspaceSlug = pathSegments[1]
                        val channelId = pathSegments[2]
                        if (workspaceSlug == "@me") {
                            Screen.Chat.createRoute(channelId)
                        } else {
                            Screen.Channel.createRoute(channelId, workspaceSlug)
                        }
                    } else {
                        Screen.Home.createRoute(null)
                    }

                    lifecycleScope.launch {
                        if (sessionManager.isLoggedIn()) {
                            navigate(route)
                        } else {
                            sessionManager.savePendingDeepLinkRoute(route)
                        }
                    }
                }
            }
            return
        }

        // Parse Shares from other apps
        if (intent.action == Intent.ACTION_SEND || intent.action == Intent.ACTION_SEND_MULTIPLE) {
            val mimeType = intent.type
            val text = intent.getStringExtra(Intent.EXTRA_TEXT)
            val uris = mutableListOf<android.net.Uri>()

            if (intent.action == Intent.ACTION_SEND) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableExtra(Intent.EXTRA_STREAM, android.net.Uri::class.java)?.let { uris.add(it) }
                } else {
                    @Suppress("DEPRECATION")
                    intent.getParcelableExtra<android.net.Uri>(Intent.EXTRA_STREAM)?.let { uris.add(it) }
                }
            } else if (intent.action == Intent.ACTION_SEND_MULTIPLE) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, android.net.Uri::class.java)?.let { uris.addAll(it) }
                } else {
                    @Suppress("DEPRECATION")
                    intent.getParcelableArrayListExtra<android.net.Uri>(Intent.EXTRA_STREAM)?.let { uris.addAll(it) }
                }
            }

            val sharedContent = com.scrymechat.android.data.local.SharedContent(
                text = text,
                uris = uris,
                mimeType = mimeType
            )
            shareManager.setSharedContent(sharedContent)

            lifecycleScope.launch {
                if (sessionManager.isLoggedIn()) {
                    navigate(Screen.Share.route)
                } else {
                    sessionManager.savePendingDeepLinkRoute(Screen.Share.route)
                }
            }
            return
        }

        val type = intent.getStringExtra("type")
        val entityId = intent.getStringExtra("entityId")

        if (type != null && entityId != null) {
            when (type) {
                "direct_message" -> navigate(Screen.Chat.createRoute(entityId))
                "channel_alert" -> navigate(Screen.Channel.createRoute(entityId))
                "friend_request" -> navigate(Screen.Friends.route)
                "mention" -> {
                    val entityType = intent.getStringExtra("entityType")
                    if (entityType == "channel") {
                        navigate(Screen.Channel.createRoute(entityId))
                    } else if (entityType == "direct_message" || entityType == "dm") {
                        navigate(Screen.Chat.createRoute(entityId))
                    }
                }
            }
        }
    }
}
