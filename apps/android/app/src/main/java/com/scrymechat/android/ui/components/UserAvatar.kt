package com.scrymechat.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage

/**
 * A reusable Discord-style avatar component.
 * Displays an image if provided, otherwise falls back to user initials on a colored background.
 */
@Composable
fun UserAvatar(
    name: String,
    avatarUrl: String?,
    size: Dp = 38.dp,
    modifier: Modifier = Modifier,
    borderColor: Color = Color.Transparent
) {
    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .then(
                if (borderColor != Color.Transparent) {
                    Modifier.border(1.dp, borderColor, CircleShape)
                } else {
                    Modifier
                }
            ),
        contentAlignment = Alignment.Center
    ) {
        if (!avatarUrl.isNullOrBlank()) {
            AsyncImage(
                model = avatarUrl,
                contentDescription = name,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
        } else {
            val initials = getInitials(name)
            val backgroundColor = getAvatarColor(name)

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(backgroundColor),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = initials,
                    color = Color.White,
                    fontSize = (size.value * 0.4).sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

private fun getInitials(name: String): String {
    if (name.isBlank()) return "?"
    val parts = name.trim().split("\\s+".toRegex())
    return if (parts.size >= 2) {
        (parts[0].take(1) + parts[1].take(1)).uppercase()
    } else {
        name.take(1).uppercase()
    }
}

private fun getAvatarColor(name: String): Color {
    val colors = listOf(
        Color(0xFF5865F2), // Blurple
        Color(0xFF3BA55C), // Green
        Color(0xFFFAA61A), // Yellow
        Color(0xFFED4245), // Red
        Color(0xFFEB459E)  // Fuchsia
    )
    if (name.isBlank()) return colors[0]
    val index = (name.hashCode() and 0x7FFFFFFF) % colors.size
    return colors[index]
}
