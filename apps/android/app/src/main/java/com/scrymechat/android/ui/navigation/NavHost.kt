package com.scrymechat.android.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.scrymechat.android.ui.home.HomeScreen
import com.scrymechat.android.ui.login.LoginScreen
import com.scrymechat.android.ui.signup.SignUpScreen
import com.scrymechat.android.ui.welcome.WelcomeScreen
import com.scrymechat.android.ui.theme.ThemeViewModel
import com.scrymechat.android.ui.profile.*
import com.scrymechat.android.ui.profile.settings.*
import com.scrymechat.android.ui.friends.FriendsScreen
import com.scrymechat.android.ui.discovery.DiscoveryScreen
import com.scrymechat.android.ui.notifications.NotificationsScreen

@Composable
fun ScrymeNavHost(
    navController: NavHostController,
    startDestination: String = Screen.Splash.route,
    themeViewModel: ThemeViewModel = hiltViewModel(),
    sessionManager: com.scrymechat.android.data.local.SessionManager = hiltViewModel<com.scrymechat.android.ui.login.LoginViewModel>().sessionManager
) {
    NavHost(navController = navController, startDestination = startDestination) {
        composable(Screen.Splash.route) {
            com.scrymechat.android.ui.welcome.SplashScreen(
                sessionManager = sessionManager,
                onNavigateToHome = {
                    navController.navigate(Screen.Home.createRoute(null)) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                },
                onNavigateToWelcome = {
                    navController.navigate(Screen.Welcome.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                }
            )
        }
        composable(Screen.Welcome.route) {
            val apiUrl by themeViewModel.apiUrl.collectAsState()
            WelcomeScreen(
                onLoginClick = { navController.navigate(Screen.Login.route) },
                onSignUpClick = { navController.navigate(Screen.SignUp.route) },
                currentApiUrl = apiUrl,
                onApiUrlChange = { themeViewModel.updateApiUrl(it) }
            )
        }
        composable(Screen.SignUp.route) {
            SignUpScreen(
                onSignUpSuccess = {
                    navController.navigate(Screen.Home.createRoute(null)) {
                        popUpTo(Screen.Welcome.route) { inclusive = true }
                    }
                },
                onBack = { navController.popBackStack() },
                onSignInClick = { navController.navigate(Screen.Login.route) }
            )
        }
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Home.createRoute(null)) {
                        popUpTo(Screen.Welcome.route) { inclusive = true }
                    }
                },
                onBack = { navController.popBackStack() },
                onSignUpClick = { navController.navigate(Screen.SignUp.route) }
            )
        }
        composable(
            route = Screen.Home.route,
            arguments = listOf(
                androidx.navigation.navArgument("slug") {
                    type = androidx.navigation.NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) { backStackEntry ->
            val workspaceSlug = backStackEntry.arguments?.getString("slug")
            HomeScreen(
                workspaceSlug = workspaceSlug,
                onSettingsClick = {
                    navController.navigate(Screen.Profile.route)
                },
                onFriendsClick = {
                    navController.navigate(Screen.Friends.route)
                },
                onDiscoveryClick = {
                    navController.navigate(Screen.Discovery.route)
                },
                onUserProfileClick = { userId ->
                    navController.navigate(Screen.OtherUserProfile.createRoute(userId))
                },
                onWorkspaceClick = { slug ->
                    navController.navigate(Screen.Home.createRoute(slug)) {
                        popUpTo(Screen.Splash.route)
                    }
                },
                onChannelClick = { channelId, slug ->
                    navController.navigate(Screen.Channel.createRoute(channelId, slug))
                },
                onDmClick = { dmId ->
                    navController.navigate(Screen.Chat.createRoute(dmId))
                },
                onNotificationsClick = {
                    navController.navigate(Screen.NotificationsPage.route)
                }
            )
        }
        composable(Screen.NotificationsPage.route) {
            NotificationsScreen(
                onBack = { navController.popBackStack() },
                onNotificationClick = { notification ->
                    navController.navigate(Screen.NotificationDetail.createRoute(notification.id))
                }
            )
        }
        composable(
            route = Screen.NotificationDetail.route,
            arguments = listOf(
                androidx.navigation.navArgument("notificationId") {
                    type = androidx.navigation.NavType.StringType
                }
            )
        ) { backStackEntry ->
            val notificationId = backStackEntry.arguments?.getString("notificationId") ?: return@composable
            com.scrymechat.android.ui.notifications.NotificationDetailScreen(
                notificationId = notificationId,
                onBack = { navController.popBackStack() },
                onNavigateToChannel = { channelId, slug ->
                    navController.navigate(Screen.Channel.createRoute(channelId, slug)) {
                        popUpTo(Screen.Home.route)
                    }
                },
                onNavigateToDm = { dmId ->
                    navController.navigate(Screen.Chat.createRoute(dmId)) {
                        popUpTo(Screen.Home.route)
                    }
                }
            )
        }
        composable(Screen.Discovery.route) {
            DiscoveryScreen(
                onBack = { navController.popBackStack() },
                onNavigateToWorkspace = { slug ->
                    navController.navigate(Screen.Home.createRoute(slug)) {
                        popUpTo(Screen.Home.route) { inclusive = true }
                    }
                },
                onDmClick = { userId ->
                    navController.navigate(Screen.Chat.createRoute(userId, isUserId = true))
                },
                onUserProfileClick = { userId ->
                    navController.navigate(Screen.OtherUserProfile.createRoute(userId))
                }
            )
        }
        composable(Screen.Friends.route) {
            FriendsScreen(
                onDmClick = { userId ->
                    navController.navigate(Screen.Chat.createRoute(userId, isUserId = true))
                },
                onUserProfileClick = { userId ->
                    navController.navigate(Screen.OtherUserProfile.createRoute(userId))
                }
            )
        }
        composable(
            route = Screen.Chat.route,
            arguments = listOf(
                androidx.navigation.navArgument("id") { type = androidx.navigation.NavType.StringType },
                androidx.navigation.navArgument("isUserId") {
                    type = androidx.navigation.NavType.BoolType
                    defaultValue = false
                }
            )
        ) { backStackEntry ->
            val id = backStackEntry.arguments?.getString("id") ?: return@composable
            val isUserId = backStackEntry.arguments?.getBoolean("isUserId") ?: false

            HomeScreen(
                dmId = if (!isUserId) id else null,
                dmUserId = if (isUserId) id else null,
                onNotificationsClick = {
                    navController.navigate(Screen.NotificationsPage.route)
                },
                onSettingsClick = {
                    navController.navigate(Screen.Profile.route)
                },
                onFriendsClick = {
                    navController.navigate(Screen.Friends.route)
                },
                onDiscoveryClick = {
                    navController.navigate(Screen.Discovery.route)
                },
                onUserProfileClick = { userId ->
                    navController.navigate(Screen.OtherUserProfile.createRoute(userId))
                },
                onWorkspaceClick = { slug ->
                    navController.navigate(Screen.Home.createRoute(slug)) {
                        popUpTo(Screen.Splash.route)
                    }
                },
                onChannelClick = { channelId, slug ->
                    navController.navigate(Screen.Channel.createRoute(channelId, slug))
                },
                onDmClick = { dmId ->
                    navController.navigate(Screen.Chat.createRoute(dmId))
                }
            )
        }
        composable(
            route = Screen.OtherUserProfile.route,
            arguments = listOf(
                androidx.navigation.navArgument("userId") { type = androidx.navigation.NavType.StringType }
            )
        ) { backStackEntry ->
            val userId = backStackEntry.arguments?.getString("userId") ?: return@composable
            OtherUserProfileScreen(
                userId = userId,
                onBack = { navController.popBackStack() },
                onSendMessage = { id ->
                    navController.navigate(Screen.Chat.createRoute(id)) {
                        popUpTo(Screen.Home.route)
                    }
                }
            )
        }
        composable(
            route = Screen.Channel.route,
            arguments = listOf(
                androidx.navigation.navArgument("channelId") {
                    type = androidx.navigation.NavType.StringType
                },
                androidx.navigation.navArgument("slug") {
                    type = androidx.navigation.NavType.StringType
                    nullable = true
                }
            )
        ) { backStackEntry ->
            val channelId = backStackEntry.arguments?.getString("channelId") ?: return@composable
            val workspaceSlug = backStackEntry.arguments?.getString("slug")

            HomeScreen(
                workspaceSlug = workspaceSlug,
                channelId = channelId,
                onNotificationsClick = {
                    navController.navigate(Screen.NotificationsPage.route)
                },
                onSettingsClick = {
                    navController.navigate(Screen.Profile.route)
                },
                onFriendsClick = {
                    navController.navigate(Screen.Friends.route)
                },
                onDiscoveryClick = {
                    navController.navigate(Screen.Discovery.route)
                },
                onUserProfileClick = { userId ->
                    navController.navigate(Screen.OtherUserProfile.createRoute(userId))
                },
                onWorkspaceClick = { slug ->
                    navController.navigate(Screen.Home.createRoute(slug)) {
                        popUpTo(Screen.Splash.route)
                    }
                },
                onChannelClick = { newChannelId, slug ->
                    navController.navigate(Screen.Channel.createRoute(newChannelId, slug))
                },
                onDmClick = { dmId ->
                    navController.navigate(Screen.Chat.createRoute(dmId))
                }
            )
        }
        composable(Screen.Profile.route) {
            ProfileScreen(
                onBack = { navController.popBackStack() },
                onNavigateToAccount = { navController.navigate(Screen.MyAccount.route) },
                onNavigateToUserProfile = { navController.navigate(Screen.UserProfile.route) },
                onNavigateToPrivacy = { navController.navigate(Screen.PrivacySafety.route) },
                onNavigateToDevices = { navController.navigate(Screen.Devices.route) },
                onNavigateToAppearance = { navController.navigate(Screen.Appearance.route) },
                onNavigateToNotifications = { navController.navigate(Screen.Notifications.route) },
                onNavigateToVoice = { navController.navigate(Screen.Voice.route) },
                onNavigateToLanguage = { navController.navigate(Screen.Language.route) },
                onNavigateToAuthorizedApps = { navController.navigate(Screen.AuthorizedApps.route) },
                onLogout = {
                    navController.navigate(Screen.Welcome.route) {
                        popUpTo(Screen.Home.route) { inclusive = true }
                    }
                }
            )
        }
        // Sub-screens
        composable(Screen.MyAccount.route) {
            MyAccountScreen(onBack = { navController.popBackStack() })
        }
        composable(Screen.UserProfile.route) {
            UserProfileScreen(onBack = { navController.popBackStack() })
        }
        composable(Screen.PrivacySafety.route) {
            PrivacySafetyScreen(onBack = { navController.popBackStack() })
        }
        composable(Screen.Devices.route) {
            DevicesScreen(onBack = { navController.popBackStack() })
        }
        composable(Screen.Appearance.route) {
            val themePreference by themeViewModel.themePreference.collectAsState()
            AppearanceSettingsScreen(
                onBack = { navController.popBackStack() },
                currentTheme = themePreference,
                onThemeChange = { themeViewModel.updateTheme(it) }
            )
        }
        composable(Screen.Notifications.route) {
            NotificationSettingsScreen(onBack = { navController.popBackStack() })
        }
        composable(Screen.Voice.route) {
            VoiceSettingsScreen(onBack = { navController.popBackStack() })
        }
        composable(Screen.Language.route) {
            LanguageSettingsScreen(onBack = { navController.popBackStack() })
        }
        composable(Screen.AuthorizedApps.route) {
            AuthorizedAppsScreen(onBack = { navController.popBackStack() })
        }
    }
}
