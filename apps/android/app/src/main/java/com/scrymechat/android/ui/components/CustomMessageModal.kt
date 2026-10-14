package com.scrymechat.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.scrymechat.android.data.remote.CustomMessageDto
import com.scrymechat.android.data.remote.MessageActionDto
import com.scrymechat.android.ui.theme.*

@Composable
fun CustomMessageModal(
    customMessage: CustomMessageDto,
    formState: Map<String, Any>,
    onUpdateForm: (String, Any) -> Unit,
    onActionTriggered: (MessageActionDto) -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .fillMaxHeight(0.82f),
            shape = RoundedCornerShape(16.dp),
            color = ScrymeDarkSurface,
            tonalElevation = 8.dp
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 18.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = customMessage.context.title,
                        color = ScrymeDarkTextPrimary,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.size(32.dp)) {
                        Icon(
                            Icons.Default.Close,
                            contentDescription = "Close",
                            tint = ScrymeDarkTextSecondary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                HorizontalDivider(color = Color.White.copy(alpha = 0.08f))

                // Content
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(18.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    customMessage.context.description?.let {
                        Text(
                            text = it,
                            color = ScrymeDarkTextSecondary,
                            fontSize = 13.5.sp,
                            lineHeight = 18.sp,
                            modifier = Modifier.padding(bottom = 14.dp)
                        )
                    }

                    MessageNodeRenderer(
                        node = customMessage.root,
                        formState = formState,
                        onUpdateForm = onUpdateForm,
                        data = customMessage.data ?: emptyMap()
                    )
                }

                HorizontalDivider(color = Color.White.copy(alpha = 0.08f))

                // Footer Actions
                if (!customMessage.actions.isNullOrEmpty()) {
                    Box(modifier = Modifier.padding(16.dp)) {
                        ActionButtonsRenderer(
                            actions = customMessage.actions,
                            onActionTriggered = {
                                onActionTriggered(it)
                                onDismiss()
                            },
                            formState = formState,
                            data = customMessage.data ?: emptyMap()
                        )
                    }
                }
            }
        }
    }
}
