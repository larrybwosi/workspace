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
                .fillMaxWidth(0.9f)
                .fillMaxHeight(0.8f),
            shape = RoundedCornerShape(16.dp),
            color = ScrymeDarkSurface
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = customMessage.context.title,
                        color = ScrymeDarkTextPrimary,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = ScrymeDarkTextSecondary)
                    }
                }

                HorizontalDivider(color = Color.Gray.copy(alpha = 0.2f))

                // Content
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(16.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    customMessage.context.description?.let {
                        Text(
                            text = it,
                            color = ScrymeDarkTextSecondary,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )
                    }

                    MessageNodeRenderer(
                        node = customMessage.root,
                        formState = formState,
                        onUpdateForm = onUpdateForm,
                        data = customMessage.data ?: emptyMap()
                    )
                }

                HorizontalDivider(color = Color.Gray.copy(alpha = 0.2f))

                // Footer Actions
                if (!customMessage.actions.isNullOrEmpty()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        customMessage.actions.forEach { action ->
                            val color = when (action.type) {
                                "PRIMARY" -> ScrymeDarkAccent
                                "DESTRUCTIVE" -> Color.Red
                                else -> Color.Gray
                            }

                            Button(
                                onClick = {
                                    onActionTriggered(action)
                                    onDismiss()
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (action.type == "GHOST") Color.Transparent else color,
                                    contentColor = if (action.type == "GHOST") color else Color.White
                                ),
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(text = action.label, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
