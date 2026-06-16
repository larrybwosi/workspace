package com.scrymechat.android.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.scrymechat.android.ui.home.HomeScreen
import com.scrymechat.android.ui.login.LoginScreen
import com.scrymechat.android.ui.settings.NotificationSettingsScreen

@Composable
fun ScrymeNavHost(
    navController: NavHostController,
    startDestination: String = Screen.Login.route
) {
    NavHost(navController = navController, startDestination = startDestination) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }
        composable(Screen.Home.route) {
            HomeScreen(
                onSettingsClick = {
                    navController.navigate(Screen.NotificationSettings.route)
                }
            )
        }
        composable(Screen.Chat.route) { backStackEntry ->
            val userId = backStackEntry.arguments?.getString("userId")
            // Placeholder for Chat screen
        }
        composable(Screen.Channel.route) { backStackEntry ->
            val channelId = backStackEntry.arguments?.getString("channelId")
            // Placeholder for Channel screen
        }
        composable(Screen.NotificationSettings.route) {
            NotificationSettingsScreen(onBack = { navController.popBackStack() })
        }
    }
}
