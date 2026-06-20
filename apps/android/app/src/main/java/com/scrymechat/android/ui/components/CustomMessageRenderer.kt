package com.scrymechat.android.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.scrymechat.android.data.remote.*
import com.scrymechat.android.ui.theme.*

/**
 * Shared visual tokens for dynamic / server-driven UI.
 *
 * Server-driven content (custom messages, forms, stats) is the riskiest
 * place for a chat app to look "AI generated" because every server payload
 * can bring its own ad-hoc color. These tokens keep the chrome — surfaces,
 * hairlines, spacing, radii — fixed and enterprise-consistent, while still
 * letting a payload's accent color (badges, card border) come through in a
 * single controlled way. Mirrors the tokens used in ChannelSidebar so the
 * whole app reads as one design language rather than per-screen choices.
 */
private object RendererTokens {
    val SurfaceRaised = Color(0xFF1F2024)
    val SurfaceSunken = Color(0xFF15161A)

    val Hairline = Color(0x1FFFFFFF)
    val HairlineStrong = Color(0x33FFFFFF)

    val Accent = Color(0xFF6C8DFF)
    val AccentMuted = Color(0x1F6C8DFF)

    val Destructive = Color(0xFFE5555F)
    val DestructiveMuted = Color(0x1FE5555F)

    val Neutral = Color(0xFF8E909C)
    val NeutralMuted = Color(0x1F8E909C)

    val RadiusOuter = 14.dp
    val RadiusInner = 10.dp
    val RadiusChip = 6.dp

    fun parse(hex: String?, fallback: Color): Color =
        if (hex.isNullOrBlank()) fallback
        else try { Color(android.graphics.Color.parseColor(hex)) } catch (e: Exception) { fallback }
}

@Composable
fun CustomMessageRenderer(
    customMessage: CustomMessageDto,
    formState: Map<String, Any>,
    onUpdateForm: (String, Any) -> Unit,
    onActionTriggered: (MessageActionDto) -> Unit,
    modifier: Modifier = Modifier,
    isLoading: Boolean = false
) {
    val accentColor = RendererTokens.parse(customMessage.context.color, RendererTokens.Accent)

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = ScrymeDarkSurface,
            contentColor = ScrymeDarkTextPrimary
        ),
        shape = RoundedCornerShape(RendererTokens.RadiusOuter),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        border = BorderStroke(
            1.dp,
            if (customMessage.context.color != null) accentColor.copy(alpha = 0.4f) else RendererTokens.Hairline
        )
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            // Header
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (customMessage.context.icon != null) {
                    Box(
                        modifier = Modifier
                            .size(30.dp)
                            .clip(RoundedCornerShape(RendererTokens.RadiusChip))
                            .background(accentColor.copy(alpha = 0.16f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = accentColor,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                }
                Text(
                    text = customMessage.context.title,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                    color = ScrymeDarkTextPrimary,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }

            customMessage.context.description?.let {
                Text(
                    text = it,
                    fontSize = 13.sp,
                    color = ScrymeDarkTextSecondary,
                    lineHeight = 18.sp,
                    modifier = Modifier.padding(top = 6.dp, start = if (customMessage.context.icon != null) 40.dp else 0.dp)
                )
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 14.dp), color = RendererTokens.Hairline)

            // Root Node
            MessageNodeRenderer(
                node = customMessage.root,
                formState = formState,
                onUpdateForm = onUpdateForm,
                data = customMessage.data ?: emptyMap()
            )

            // Actions
            if (!customMessage.actions.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(16.dp))
                ActionButtonsRenderer(
                    actions = customMessage.actions,
                    onActionTriggered = onActionTriggered,
                    isLoading = isLoading
                )
            }
        }
    }
}

@Composable
fun MessageNodeRenderer(
    node: MessageNodeDto,
    formState: Map<String, Any>,
    onUpdateForm: (String, Any) -> Unit,
    data: Map<String, Any>
) {
    if (!evaluateCondition(node.condition, formState, data)) return

    when (node.type) {
        "Layout.Stack" -> {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                node.children?.forEach { child ->
                    MessageNodeRenderer(child, formState, onUpdateForm, data)
                }
            }
        }
        "Layout.Row" -> {
             Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                node.children?.forEach { child ->
                    Box(modifier = Modifier.weight(1f)) {
                        MessageNodeRenderer(child, formState, onUpdateForm, data)
                    }
                }
            }
        }
        "Layout.Grid" -> {
            val columns = (node.properties?.get("columns") as? Number)?.toInt() ?: 2
            val children = node.children ?: emptyList()
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                children.chunked(columns).forEach { rowChildren ->
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        rowChildren.forEach { child ->
                            Box(modifier = Modifier.weight(1f)) {
                                MessageNodeRenderer(child, formState, onUpdateForm, data)
                            }
                        }
                        repeat(columns - rowChildren.size) {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }
        "Layout.Card" -> {
            Surface(
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                color = RendererTokens.SurfaceSunken,
                shape = RoundedCornerShape(RendererTokens.RadiusInner),
                border = BorderStroke(1.dp, RendererTokens.Hairline)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    node.children?.forEach { child ->
                        MessageNodeRenderer(child, formState, onUpdateForm, data)
                    }
                }
            }
        }
        "Text.Paragraph" -> {
            val content = node.properties?.get("content") as? String ?: ""
            Text(
                text = interpolate(content, formState, data),
                color = ScrymeDarkTextPrimary,
                fontSize = 14.sp,
                lineHeight = 20.sp
            )
        }
        "Text.Heading" -> {
            val content = node.properties?.get("content") as? String ?: ""
            val level = (node.properties?.get("level") as? Number)?.toInt() ?: 1
            Text(
                text = interpolate(content, formState, data),
                color = ScrymeDarkTextPrimary,
                fontWeight = FontWeight.SemiBold,
                fontSize = if (level == 1) 19.sp else if (level == 2) 17.sp else 15.sp,
                modifier = Modifier.padding(vertical = 4.dp)
            )
        }
        "Display.Field" -> {
            val label = node.properties?.get("label") as? String ?: ""
            val value = node.properties?.get("value")?.toString() ?: ""
            Column(modifier = Modifier.padding(vertical = 2.dp)) {
                Text(
                    text = label.uppercase(),
                    color = ScrymeDarkTextSecondary,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.4.sp
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = interpolate(value, formState, data),
                    color = ScrymeDarkTextPrimary,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
        "Display.Badge" -> {
            val label = node.properties?.get("label") as? String ?: ""
            val color = RendererTokens.parse(node.properties?.get("color") as? String, RendererTokens.Accent)

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(RendererTokens.RadiusChip))
                    .background(color.copy(alpha = 0.14f))
                    .border(BorderStroke(1.dp, color.copy(alpha = 0.3f)), RoundedCornerShape(RendererTokens.RadiusChip))
                    .padding(horizontal = 8.dp, vertical = 3.dp)
            ) {
                Text(text = label, color = color, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
            }
        }
        "Input.Text" -> {
            val id = node.id ?: return
            val label = node.properties?.get("label") as? String ?: ""
            val placeholder = node.properties?.get("placeholder") as? String ?: ""
            val value = formState[id] as? String ?: ""

            Column(modifier = Modifier.padding(vertical = 4.dp)) {
                if (label.isNotEmpty()) {
                    Text(
                        text = label,
                        color = ScrymeDarkTextSecondary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                }
                OutlinedTextField(
                    value = value,
                    onValueChange = { onUpdateForm(id, it) },
                    placeholder = { Text(placeholder, fontSize = 14.sp, color = ScrymeDarkTextSecondary.copy(alpha = 0.6f)) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(RendererTokens.RadiusInner),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = RendererTokens.SurfaceSunken,
                        unfocusedContainerColor = RendererTokens.SurfaceSunken,
                        focusedTextColor = ScrymeDarkTextPrimary,
                        unfocusedTextColor = ScrymeDarkTextPrimary,
                        focusedBorderColor = RendererTokens.Accent,
                        unfocusedBorderColor = RendererTokens.Hairline,
                        cursorColor = RendererTokens.Accent
                    ),
                    textStyle = androidx.compose.ui.text.TextStyle(fontSize = 14.sp),
                    singleLine = true
                )
            }
        }
        "Input.Switch" -> {
            val id = node.id ?: return
            val label = node.properties?.get("label") as? String ?: ""
            val checked = formState[id] as? Boolean ?: false

            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = label, color = ScrymeDarkTextPrimary, fontSize = 14.sp, modifier = Modifier.weight(1f))
                Switch(
                    checked = checked,
                    onCheckedChange = { onUpdateForm(id, it) },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = Color.White,
                        checkedTrackColor = RendererTokens.Accent,
                        uncheckedBorderColor = RendererTokens.HairlineStrong
                    )
                )
            }
        }
        "Input.Checkbox" -> {
            val id = node.id ?: return
            val label = node.properties?.get("label") as? String ?: ""
            val checked = formState[id] as? Boolean ?: false

            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Checkbox(
                    checked = checked,
                    onCheckedChange = { onUpdateForm(id, it) },
                    colors = CheckboxDefaults.colors(checkedColor = RendererTokens.Accent)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(text = label, color = ScrymeDarkTextPrimary, fontSize = 14.sp)
            }
        }
        "Input.Select" -> {
            val id = node.id ?: return
            val label = node.properties?.get("label") as? String ?: ""
            val options = node.properties?.get("options") as? List<Map<String, Any>> ?: emptyList()
            var expanded by remember { mutableStateOf(false) }
            val selectedValue = formState[id]?.toString() ?: ""
            val selectedLabel = options.find { it["value"]?.toString() == selectedValue }?.get("label") as? String ?: selectedValue

            Column(modifier = Modifier.padding(vertical = 4.dp)) {
                if (label.isNotEmpty()) {
                    Text(
                        text = label,
                        color = ScrymeDarkTextSecondary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                }
                Box {
                    OutlinedButton(
                        onClick = { expanded = true },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(RendererTokens.RadiusInner),
                        border = BorderStroke(1.dp, RendererTokens.Hairline),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = ScrymeDarkTextPrimary)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = selectedLabel.ifEmpty { "Select an option" },
                                fontSize = 14.sp,
                                color = if (selectedLabel.isEmpty()) ScrymeDarkTextSecondary else ScrymeDarkTextPrimary
                            )
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = null,
                                tint = ScrymeDarkTextSecondary
                            )
                        }
                    }
                    DropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false },
                        modifier = Modifier.background(RendererTokens.SurfaceRaised)
                    ) {
                        options.forEach { option ->
                            val optLabel = option["label"] as? String ?: ""
                            val optValue = option["value"]?.toString() ?: ""
                            DropdownMenuItem(
                                text = { Text(optLabel, color = ScrymeDarkTextPrimary, fontSize = 14.sp) },
                                onClick = {
                                    onUpdateForm(id, optValue)
                                    expanded = false
                                }
                            )
                        }
                    }
                }
            }
        }
        "Data.ProgressBar" -> {
            val value = (node.properties?.get("value") as? Number)?.toFloat() ?: 0f
            val max = (node.properties?.get("max") as? Number)?.toFloat() ?: 100f
            val label = node.properties?.get("label") as? String

            Column(modifier = Modifier.padding(vertical = 8.dp)) {
                if (label != null) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = label, color = ScrymeDarkTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                        Text(
                            text = "${(value / max * 100).toInt()}%",
                            color = ScrymeDarkTextPrimary,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                }
                LinearProgressIndicator(
                    progress = { value / max },
                    modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                    color = RendererTokens.Accent,
                    trackColor = RendererTokens.NeutralMuted
                )
            }
        }
        "Data.StatsGrid" -> {
            val children = node.children ?: emptyList()
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                children.chunked(2).forEach { rowChildren ->
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        rowChildren.forEach { child ->
                            Box(modifier = Modifier.weight(1f)) {
                                MessageNodeRenderer(child, formState, onUpdateForm, data)
                            }
                        }
                        if (rowChildren.size == 1) {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }
        "Data.Stat" -> {
            val label = node.properties?.get("label") as? String ?: ""
            val value = node.properties?.get("value")?.toString() ?: ""
            Surface(
                color = RendererTokens.SurfaceSunken,
                shape = RoundedCornerShape(RendererTokens.RadiusInner),
                border = BorderStroke(1.dp, RendererTokens.Hairline),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), horizontalAlignment = Alignment.Start) {
                    Text(
                        text = label.uppercase(),
                        color = ScrymeDarkTextSecondary,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 0.4.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = interpolate(value, formState, data),
                        color = ScrymeDarkTextPrimary,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
        else -> {
            if (node.children != null) {
                Column {
                    node.children.forEach { child ->
                        MessageNodeRenderer(child, formState, onUpdateForm, data)
                    }
                }
            }
        }
    }
}

@Composable
fun ActionButtonsRenderer(
    actions: List<MessageActionDto>,
    onActionTriggered: (MessageActionDto) -> Unit,
    isLoading: Boolean = false
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        actions.forEach { action ->
            val (containerColor, contentColor, border) = when (action.type) {
                "PRIMARY" -> Triple(RendererTokens.Accent, Color.White, null)
                "DESTRUCTIVE" -> Triple(RendererTokens.Destructive, Color.White, null)
                "GHOST" -> Triple(Color.Transparent, ScrymeDarkTextSecondary, BorderStroke(1.dp, RendererTokens.Hairline))
                else -> Triple(RendererTokens.SurfaceRaised, ScrymeDarkTextPrimary, BorderStroke(1.dp, RendererTokens.Hairline))
            }

            Button(
                onClick = { onActionTriggered(action) },
                enabled = !isLoading,
                colors = ButtonDefaults.buttonColors(
                    containerColor = containerColor,
                    contentColor = contentColor,
                    disabledContainerColor = containerColor.copy(alpha = 0.5f),
                    disabledContentColor = contentColor.copy(alpha = 0.7f)
                ),
                border = border,
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp, pressedElevation = 0.dp),
                modifier = Modifier.weight(1f).height(40.dp),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                shape = RoundedCornerShape(RendererTokens.RadiusInner)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        color = contentColor,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text(text = action.label, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

fun evaluateCondition(condition: MessageConditionDto?, formState: Map<String, Any>, data: Map<String, Any>): Boolean {
    if (condition == null) return true

    val actualValue = formState[condition.field] ?: data[condition.field]

    return when (condition.operator) {
        "EQUALS" -> actualValue == condition.value
        "NOT_EQUALS" -> actualValue != condition.value
        "EXISTS" -> actualValue != null
        "NOT_EXISTS" -> actualValue == null
        "CONTAINS" -> (actualValue as? String)?.contains(condition.value as? String ?: "") ?: false
        "GREATER_THAN" -> (actualValue as? Number)?.toDouble() ?: 0.0 > (condition.value as? Number)?.toDouble() ?: 0.0
        "LESS_THAN" -> (actualValue as? Number)?.toDouble() ?: 0.0 < (condition.value as? Number)?.toDouble() ?: 0.0
        else -> true
    }
}

fun interpolate(text: String, formState: Map<String, Any>, data: Map<String, Any>): String {
    var result = text
    val combined = data + formState
    combined.forEach { (key, value) ->
        result = result.replace("{{$key}}", value.toString())
    }
    return result
}
