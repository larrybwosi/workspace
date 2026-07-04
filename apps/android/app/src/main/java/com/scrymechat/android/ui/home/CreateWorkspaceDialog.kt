package com.scrymechat.android.ui.home

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.scrymechat.android.data.remote.CreateWorkspaceRequest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateWorkspaceDialog(
    isLoading: Boolean = false,
    onDismiss: () -> Unit,
    onCreate: (CreateWorkspaceRequest) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var slug by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var isPublic by remember { mutableStateOf(false) }
    var isSlugEdited by remember { mutableStateOf(false) }

    // Derive slug from name unless user has manually edited it
    val autoSlug = remember(name) {
        name.lowercase().replace(Regex("[^a-z0-9]+"), "-").trim('-')
    }
    val effectiveSlug = if (isSlugEdited && slug.isNotBlank()) slug else autoSlug

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            shape = RoundedCornerShape(24.dp),
            color = SidebarTokens.SurfaceRaised
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {

                // ── Signature: gradient accent stripe ──────────────────────────
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(3.dp)
                        .background(
                            Brush.horizontalGradient(
                                listOf(SidebarTokens.Accent, SidebarTokens.Accent.copy(alpha = 0.25f))
                            )
                        )
                )

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 24.dp)
                        .padding(top = 22.dp, bottom = 24.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp)
                ) {

                    // ── Live preview header ────────────────────────────────────
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        // Workspace avatar — shows first letter as user types
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(SidebarTokens.Accent.copy(alpha = 0.12f))
                                .border(
                                    width = 1.dp,
                                    color = SidebarTokens.Accent.copy(
                                        alpha = if (name.isNotBlank()) 0.45f else 0.18f
                                    ),
                                    shape = RoundedCornerShape(14.dp)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            AnimatedContent(
                                targetState = name.trim().firstOrNull()?.uppercase(),
                                transitionSpec = {
                                    fadeIn(tween(150)) togetherWith fadeOut(tween(150))
                                },
                                label = "workspace_initial"
                            ) { initial ->
                                if (initial != null) {
                                    Text(
                                        text = initial,
                                        color = SidebarTokens.Accent,
                                        fontSize = 22.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                } else {
                                    Icon(
                                        imageVector = Icons.Rounded.Groups,
                                        contentDescription = null,
                                        tint = SidebarTokens.Accent.copy(alpha = 0.35f),
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                            }
                        }

                        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                            Text(
                                "New Workspace",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = SidebarTokens.TextPrimary
                            )
                            // URL preview updates as user types
                            AnimatedContent(
                                targetState = effectiveSlug.ifBlank { null },
                                transitionSpec = {
                                    fadeIn(tween(120)) togetherWith fadeOut(tween(120))
                                },
                                label = "slug_preview"
                            ) { slugLabel ->
                                Text(
                                    text = if (slugLabel != null) "scrymechat.com/$slugLabel"
                                           else "Give your workspace a name",
                                    fontSize = 12.sp,
                                    color = if (slugLabel != null) SidebarTokens.Accent.copy(alpha = 0.7f)
                                            else SidebarTokens.TextSecondary.copy(alpha = 0.45f)
                                )
                            }
                        }
                    }

                    HorizontalDivider(
                        color = SidebarTokens.TextSecondary.copy(alpha = 0.08f)
                    )

                    // ── Name ──────────────────────────────────────────────────
                    WorkspaceTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = "Workspace Name",
                        placeholder = "e.g. Design Team",
                        leadingIcon = Icons.Rounded.Group,
                        imeAction = ImeAction.Next,
                        capitalization = KeyboardCapitalization.Words
                    )

                    // ── Slug ──────────────────────────────────────────────────
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        WorkspaceTextField(
                            value = if (isSlugEdited) slug else autoSlug,
                            onValueChange = { slug = it; isSlugEdited = true },
                            label = "URL Slug",
                            placeholder = "auto-generated",
                            leadingIcon = Icons.Rounded.Link,
                            imeAction = ImeAction.Next,
                            trailingIcon = if (isSlugEdited) Icons.Rounded.Refresh else Icons.Rounded.AutoAwesome,
                            onTrailingIconClick = if (isSlugEdited) {
                                { isSlugEdited = false; slug = "" }
                            } else null
                        )
                        Text(
                            text = "scrymechat.com/${effectiveSlug.ifBlank { "…" }}",
                            fontSize = 11.sp,
                            color = SidebarTokens.TextSecondary.copy(alpha = 0.55f),
                            modifier = Modifier.padding(start = 4.dp)
                        )
                    }

                    // ── Description ───────────────────────────────────────────
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        WorkspaceTextField(
                            value = description,
                            onValueChange = { if (it.length <= 200) description = it },
                            label = "Description",
                            placeholder = "What's this workspace for? (optional)",
                            leadingIcon = Icons.Rounded.Notes,
                            imeAction = ImeAction.Done,
                            singleLine = false,
                            maxLines = 3
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            Text(
                                "${description.length}/200",
                                fontSize = 11.sp,
                                color = if (description.length > 180) SidebarTokens.Accent
                                        else SidebarTokens.TextSecondary.copy(alpha = 0.35f)
                            )
                        }
                    }

                    // ── Public / Private toggle card ──────────────────────────
                    Surface(
                        onClick = { isPublic = !isPublic },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        color = if (isPublic) SidebarTokens.Accent.copy(alpha = 0.07f)
                                else SidebarTokens.TextSecondary.copy(alpha = 0.04f),
                        border = BorderStroke(
                            width = 1.dp,
                            color = if (isPublic) SidebarTokens.Accent.copy(alpha = 0.28f)
                                    else SidebarTokens.TextSecondary.copy(alpha = 0.1f)
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                // Icon badge
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = if (isPublic) SidebarTokens.Accent.copy(alpha = 0.14f)
                                            else SidebarTokens.TextSecondary.copy(alpha = 0.08f),
                                    modifier = Modifier.size(36.dp)
                                ) {
                                    Box(
                                        contentAlignment = Alignment.Center,
                                        modifier = Modifier.fillMaxSize()
                                    ) {
                                        AnimatedContent(
                                            targetState = isPublic,
                                            transitionSpec = {
                                                fadeIn(tween(180)) togetherWith fadeOut(tween(180))
                                            },
                                            label = "toggle_icon"
                                        ) { public ->
                                            Icon(
                                                imageVector = if (public) Icons.Rounded.Public else Icons.Rounded.Lock,
                                                contentDescription = null,
                                                tint = if (public) SidebarTokens.Accent else SidebarTokens.TextSecondary,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    }
                                }

                                Column(verticalArrangement = Arrangement.spacedBy(1.dp)) {
                                    AnimatedContent(
                                        targetState = isPublic,
                                        transitionSpec = {
                                            fadeIn(tween(150)) togetherWith fadeOut(tween(150))
                                        },
                                        label = "toggle_label"
                                    ) { public ->
                                        Text(
                                            text = if (public) "Public" else "Private",
                                            color = SidebarTokens.TextPrimary,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                    Text(
                                        text = if (isPublic) "Anyone can discover and join"
                                               else "Invite-only access",
                                        color = SidebarTokens.TextSecondary,
                                        fontSize = 12.sp
                                    )
                                }
                            }

                            Switch(
                                checked = isPublic,
                                onCheckedChange = { isPublic = it },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = SidebarTokens.Accent,
                                    uncheckedThumbColor = SidebarTokens.TextSecondary.copy(alpha = 0.55f),
                                    uncheckedTrackColor = SidebarTokens.TextSecondary.copy(alpha = 0.12f),
                                    uncheckedBorderColor = SidebarTokens.TextSecondary.copy(alpha = 0.2f)
                                )
                            )
                        }
                    }

                    // ── Actions ───────────────────────────────────────────────
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedButton(
                            onClick = onDismiss,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = SidebarTokens.TextSecondary
                            ),
                            border = BorderStroke(
                                1.dp,
                                SidebarTokens.TextSecondary.copy(alpha = 0.18f)
                            )
                        ) {
                            Text("Cancel", fontWeight = FontWeight.Medium)
                        }

                        Button(
                            onClick = {
                                onCreate(
                                    CreateWorkspaceRequest(
                                        name = name,
                                        slug = effectiveSlug,
                                        description = description.ifBlank { null },
                                        isPublic = isPublic
                                    )
                                )
                            },
                            enabled = name.isNotBlank() && !isLoading,
                            modifier = Modifier.weight(2f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = SidebarTokens.Accent,
                                disabledContainerColor = SidebarTokens.Accent.copy(alpha = 0.28f),
                                disabledContentColor = Color.White.copy(alpha = 0.45f)
                            )
                        ) {
                            AnimatedContent(
                                targetState = isLoading,
                                transitionSpec = {
                                    fadeIn(tween(150)) togetherWith fadeOut(tween(150))
                                },
                                label = "button_state"
                            ) { loading ->
                                if (loading) {
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(14.dp),
                                            color = Color.White,
                                            strokeWidth = 2.dp
                                        )
                                        Text("Creating…", fontWeight = FontWeight.SemiBold)
                                    }
                                } else {
                                    Text("Create Workspace", fontWeight = FontWeight.SemiBold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ── Shared text field component ────────────────────────────────────────────────

@Composable
private fun WorkspaceTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    placeholder: String = "",
    leadingIcon: ImageVector,
    imeAction: ImeAction = ImeAction.Next,
    capitalization: KeyboardCapitalization = KeyboardCapitalization.None,
    singleLine: Boolean = true,
    maxLines: Int = 1,
    trailingIcon: ImageVector? = null,
    onTrailingIconClick: (() -> Unit)? = null
) {
    var isFocused by remember { mutableStateOf(false) }

    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label, fontSize = 12.sp) },
        placeholder = {
            Text(
                placeholder,
                color = SidebarTokens.TextSecondary.copy(alpha = 0.32f),
                fontSize = 14.sp
            )
        },
        modifier = Modifier
            .fillMaxWidth()
            .onFocusChanged { isFocused = it.isFocused },
        singleLine = singleLine,
        maxLines = if (singleLine) 1 else maxLines,
        leadingIcon = {
            Icon(
                imageVector = leadingIcon,
                contentDescription = null,
                tint = if (isFocused) SidebarTokens.Accent
                       else SidebarTokens.TextSecondary.copy(alpha = 0.4f),
                modifier = Modifier.size(18.dp)
            )
        },
        trailingIcon = trailingIcon?.let {
            {
                if (onTrailingIconClick != null) {
                    IconButton(
                        onClick = onTrailingIconClick,
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(
                            imageVector = it,
                            contentDescription = "Reset slug",
                            tint = SidebarTokens.Accent,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                } else {
                    Icon(
                        imageVector = it,
                        contentDescription = null,
                        tint = SidebarTokens.Accent.copy(alpha = 0.45f),
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        },
        keyboardOptions = KeyboardOptions(
            imeAction = imeAction,
            capitalization = capitalization
        ),
        shape = RoundedCornerShape(10.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = SidebarTokens.Accent,
            unfocusedBorderColor = SidebarTokens.TextSecondary.copy(alpha = 0.16f),
            focusedLabelColor = SidebarTokens.Accent,
            unfocusedLabelColor = SidebarTokens.TextSecondary.copy(alpha = 0.5f),
            focusedTextColor = SidebarTokens.TextPrimary,
            unfocusedTextColor = SidebarTokens.TextPrimary,
            cursorColor = SidebarTokens.Accent,
            focusedContainerColor = SidebarTokens.Accent.copy(alpha = 0.03f),
            unfocusedContainerColor = Color.Transparent
        )
    )
}
