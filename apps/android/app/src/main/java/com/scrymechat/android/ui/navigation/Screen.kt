package com.scrymechat.android.ui.navigation

sealed class Screen(val route: String) {
    object Welcome : Screen("welcome")
    object SignUp : Screen("signup")
    object Login : Screen("login")
    object Home : Screen("home?slug={slug}") {
        fun createRoute(slug: String?) = if (slug != null) "home?slug=$slug" else "home"
    }
    object Discovery : Screen("discovery")
    object Friends : Screen("friends")
    object Chat : Screen("chat/{userId}") {
        fun createRoute(userId: String) = "chat/$userId"
    }
    object Channel : Screen("channel/{channelId}") {
        fun createRoute(channelId: String) = "channel/$channelId"
    }
    object Profile : Screen("profile")
    object MyAccount : Screen("profile/account")
    object UserProfile : Screen("profile/user")
    object PrivacySafety : Screen("profile/privacy")
    object Devices : Screen("profile/devices")
    object Appearance : Screen("profile/appearance")
    object Notifications : Screen("profile/notifications")
    object Voice : Screen("profile/voice")
    object Language : Screen("profile/language")
    object AuthorizedApps : Screen("profile/apps")
}
