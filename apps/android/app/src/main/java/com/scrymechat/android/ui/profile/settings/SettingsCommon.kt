package com.scrymechat.android.ui.profile.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.scrymechat.android.ui.profile.ProfilePalette

/**
 * Shared layout tokens. Centralizing these keeps spacing/radius consistent
 * across every settings surface instead of ad-hoc dp values per screen.
 */
internal object SettingsTokens {
    val ScreenPadding = 20.dp
    val SectionSpacing = 28.dp
    val FieldSpacing = 14.dp
    val CardRadius = 12.dp
    val CardBorderWidth = 1.dp
    val RowVerticalPadding = 14.dp
}

@Composable
internal fun SectionHeader(
    title: String,
    palette: ProfilePalette,
    subtitle: String? = null
) {
    Column {
        Text(
            text = title.uppercase(),
            color = palette.textTertiary,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold
        )
        if (subtitle != null) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = subtitle,
                color = palette.textSecondary,
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

/**
 * A neutral, low-emphasis card container used to group related settings —
 * mirrors the "panel" pattern common in enterprise admin consoles.
 */
@Composable
internal fun SettingsCard(
    palette: ProfilePalette,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(SettingsTokens.CardRadius))
            .background(palette.cardSurface)
            .border(SettingsTokens.CardBorderWidth, palette.cardBorder, RoundedCornerShape(SettingsTokens.CardRadius))
            .padding(16.dp),
        content = content
    )
}

@Composable
internal fun standardTextFieldColors(palette: ProfilePalette) = OutlinedTextFieldDefaults.colors(
    focusedTextColor = palette.textPrimary,
    unfocusedTextColor = palette.textPrimary,
    focusedBorderColor = palette.accent,
    unfocusedBorderColor = palette.cardBorder,
    focusedLabelColor = palette.accent,
    unfocusedLabelColor = palette.textSecondary,
    cursorColor = palette.accent
)

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
internal fun SettingsTopBar(
    title: String,
    palette: ProfilePalette,
    onBack: () -> Unit
) {
    TopAppBar(
        title = {
            Text(
                title,
                color = palette.textPrimary,
                fontWeight = FontWeight.SemiBold
            )
        },
        navigationIcon = {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = palette.textPrimary)
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(containerColor = palette.topBarBg)
    )
}

/** A labeled row with a trailing action button — used for one-off settings actions. */
@Composable
internal fun SettingsActionRow(
    icon: ImageVector,
    title: String,
    description: String,
    actionLabel: String,
    palette: ProfilePalette,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(palette.accent.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = palette.accent, modifier = Modifier.size(18.dp))
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = palette.textPrimary, fontWeight = FontWeight.Medium, style = MaterialTheme.typography.bodyLarge)
            Text(description, color = palette.textSecondary, style = MaterialTheme.typography.bodySmall)
        }
        Spacer(modifier = Modifier.width(12.dp))
        OutlinedButton(
            onClick = onClick,
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = palette.accent)
        ) {
            Text(actionLabel)
        }
    }
}
