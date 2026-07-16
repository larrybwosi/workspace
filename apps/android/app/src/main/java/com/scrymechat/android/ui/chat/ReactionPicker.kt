package com.scrymechat.android.ui.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.ripple.rememberRipple
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Data model for a selectable reaction. Keeping the emoji and an
 * accessible label together avoids re-deriving semantics at the call site.
 */
data class Reaction(
    val emoji: String,
    val label: String
)

private val defaultReactions = listOf(
    Reaction("👍", "Thumbs up"),
    Reaction("❤️", "Heart"),
    Reaction("😂", "Laughing"),
    Reaction("😮", "Surprised"),
    Reaction("😢", "Sad"),
    Reaction("🔥", "Fire"),
    Reaction("💯", "Hundred points"),
    Reaction("✅", "Check mark"),
    Reaction("🙌", "Raised hands"),
    Reaction("🎉", "Celebration"),
    Reaction("✨", "Sparkles"),
    Reaction("🚀", "Rocket"),
    Reaction("🤔", "Thinking"),
    Reaction("👀", "Eyes"),
    Reaction("👋", "Wave")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReactionPicker(
    onEmojiSelected: (String) -> Unit,
    onDismiss: () -> Unit,
    reactions: List<Reaction> = defaultReactions,
    sheetState: SheetState = rememberModalBottomSheetState()
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        dragHandle = { BottomSheetDefaults.DragHandle() },
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 1.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp)
        ) {
            ReactionPickerHeader(onDismiss = onDismiss)

            HorizontalDivider(
                color = MaterialTheme.colorScheme.outlineVariant,
                thickness = 1.dp
            )

            LazyVerticalGrid(
                columns = GridCells.Fixed(5),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                items(reactions, key = { it.emoji }) { reaction ->
                    ReactionCell(
                        reaction = reaction,
                        onClick = {
                            onEmojiSelected(reaction.emoji)
                            onDismiss()
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun ReactionPickerHeader(onDismiss: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 20.dp, end = 12.dp, top = 4.dp, bottom = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = "Add Reaction",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface
        )
        IconButton(onClick = onDismiss) {
            Icon(
                imageVector = Icons.Outlined.Close,
                contentDescription = "Close reaction picker",
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun ReactionCell(
    reaction: Reaction,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val background = if (isPressed) {
        MaterialTheme.colorScheme.secondaryContainer
    } else {
        Color.Transparent
    }

    Box(
        modifier = Modifier
            .size(56.dp)
            .clip(CircleShape)
            .background(background)
            .semantics { contentDescription = reaction.label }
            .clickable(
                interactionSource = interactionSource,
                indication = rememberRipple(bounded = true, radius = 28.dp),
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(text = reaction.emoji, fontSize = 26.sp)
    }
}
