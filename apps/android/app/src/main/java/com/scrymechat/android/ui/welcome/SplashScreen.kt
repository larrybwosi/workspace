package com.scrymechat.android.ui.welcome

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.scrymechat.android.data.local.SessionManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.firstOrNull

@Composable
fun SplashScreen(
    sessionManager: SessionManager,
    onNavigateToHome: () -> Unit,
    onNavigateToWelcome: () -> Unit
) {
    // Aesthetics matching WelcomeScreen
    val accentColor = Color(0xFF6366F1) // Indigo

    LaunchedEffect(Unit) {
        // Minimum delay for splash aesthetic
        delay(1500)

        val session = sessionManager.getActiveSessionFlow().firstOrNull()
        if (session != null) {
            onNavigateToHome()
        } else {
            onNavigateToWelcome()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        MeshBackground(accentColor = accentColor)

        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                painter = androidx.compose.ui.res.painterResource(id = com.scrymechat.android.R.drawable.ic_logo),
                contentDescription = "Scrymechat Logo",
                tint = Color.Unspecified,
                modifier = Modifier.size(110.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "SCRYMECHAT",
                style = MaterialTheme.typography.displaySmall.copy(
                    color = Color.White,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 4.sp
                )
            )
            Spacer(modifier = Modifier.height(24.dp))
            CircularProgressIndicator(
                color = Color.White.copy(alpha = 0.5f),
                strokeWidth = 2.dp,
                modifier = Modifier.size(24.dp)
            )
        }
    }
}
