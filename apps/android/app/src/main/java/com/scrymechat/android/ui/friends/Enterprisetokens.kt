package com.scrymechat.android.ui.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/**
 * Shared visual tokens for the "enterprise" design pass.
 *
 * Previously ChannelSidebar and CustomMessageRenderer each defined their
 * own private copy of these values (same intent, slightly different
 * numbers). Centralizing them here means a future palette change is a
 * one-file edit, and every screen stays visually identical instead of
 * drifting apart over time.
 *
 * To finish the migration: replace the private `SidebarTokens` object in
 * ChannelSidebar.kt and the private `RendererTokens` object in
 * CustomMessageRenderer.kt with this one (same field names), and delete
 * the duplicates. Left as-is for now so this change doesn't touch files
 * outside today's request.
 */
object EnterpriseTokens {
    // Surfaces — restrained, low-contrast steps so elevation reads as
    // material rather than as a sudden color jump.
    val SurfaceBase = Color(0xFF18191D)
    val SurfaceRaised = Color(0xFF1F2024)
    val SurfaceSunken = Color(0xFF15161A)
    val SurfaceSelected = Color(0xFF262830)
    val SurfaceFooter = Color(0xFF111216)

    // Hairlines instead of flat block dividers.
    val Hairline = Color(0x1FFFFFFF)
    val HairlineStrong = Color(0x33FFFFFF)

    // One restrained brand accent, used sparingly.
    val Accent = Color(0xFF6C8DFF)
    val AccentMuted = Color(0x1F6C8DFF)

    val Success = Color(0xFF34C77B)
    val SuccessMuted = Color(0x1F34C77B)

    val Warning = Color(0xFFE5A53E)
    val WarningMuted = Color(0x1FE5A53E)

    val Destructive = Color(0xFFE5555F)
    val DestructiveMuted = Color(0x1FE5555F)

    val Neutral = Color(0xFF8E909C)
    val NeutralMuted = Color(0x1F8E909C)

    val TextPrimary = Color(0xFFEDEEF1)
    val TextSecondary = Color(0xFF8E909C)
    val TextTertiary = Color(0xFF6B6D78)

    val RadiusOuter = 14.dp
    val RadiusInner = 10.dp
    val RadiusChip = 6.dp

    fun parse(hex: String?, fallback: Color): Color =
        if (hex.isNullOrBlank()) fallback
        else try { Color(android.graphics.Color.parseColor(hex)) } catch (e: Exception) { fallback }
}
