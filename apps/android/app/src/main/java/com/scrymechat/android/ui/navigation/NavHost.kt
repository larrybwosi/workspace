package com.scrymechat.android.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.scrymechat.android.ui.home.HomeScreen
import com.scrymechat.android.ui.login.LoginScreen
import com.scrymechat.android.ui.signup.SignUpScreen
import com.scrymechat.android.ui.welcome.WelcomeScreen
import com.scrymechat.android.ui.profile.*
import com.scrymechat.android.ui.settings.NotificationSettingsScreen

@Composable
fun ScrymeNavHost(
    navController: NavHostController,
    startDestination: String = Screen.Welcome.route
) {
    NavHost(navController = navController, startDestination = startDestination) {
        composable(Screen.Welcome.route) {
            WelcomeScreen(
                onLoginClick = { navController.navigate(Screen.Login.route) },
                onSignUpClick = { navController.navigate(Screen.SignUp.route) }
            )
        }
        composable(Screen.SignUp.route) {
            SignUpScreen(
                onSignUpSuccess = {
                    navController.navigate(Screen.Home.route) {
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
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Welcome.route) { inclusive = true }
                    }
                },
                onBack = { navController.popBackStack() },
                onSignUpClick = { navController.navigate(Screen.SignUp.route) }
            )
        }
        composable(Screen.Home.route) {
            HomeScreen(
                onSettingsClick = {
                    navController.navigate(Screen.Profile.route)
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
            AppearanceSettingsScreen(onBack = { navController.popBackStack() })
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
