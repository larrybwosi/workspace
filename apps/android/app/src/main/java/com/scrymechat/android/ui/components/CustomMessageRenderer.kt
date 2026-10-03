package com.scrymechat.android.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.scrymechat.android.data.remote.*
import com.scrymechat.android.ui.theme.*

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
fun PriorityBadge(priority: String) {
    val (bgColor, textColor, text) = when (priority.lowercase()) {
        "urgent" -> Triple(Color(0xFFE5555F).copy(alpha = 0.2f), Color(0xFFFF6B75), "URGENT")
        "high" -> Triple(Color(0xFFFF9F43).copy(alpha = 0.2f), Color(0xFFFFB057), "HIGH")
        "low" -> Triple(Color(0xFF28C76F).copy(alpha = 0.2f), Color(0xFF48DA89), "LOW")
        else -> return
    }

    Surface(
        color = bgColor,
        shape = RoundedCornerShape(4.dp),
        modifier = Modifier.padding(start = 6.dp)
    ) {
        Text(
            text = text,
            color = textColor,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
            letterSpacing = 0.5.sp
        )
    }
}

@Composable
fun CustomMessageRenderer(
    customMessage: CustomMessageDto,
    formState: Map<String, Any>,
    onUpdateForm: (String, Any) -> Unit,
    onActionTriggered: (MessageActionDto) -> Unit,
    modifier: Modifier = Modifier,
    isLoading: Boolean = false,
    respondedActionIds: Set<String> = emptySet()
) {
    val theme = customMessage.theme
    val defaultBg = ScrymeDarkSurface
    val containerColor = RendererTokens.parse(theme?.backgroundColor, defaultBg)
    val accentColor = RendererTokens.parse(customMessage.context.color, RendererTokens.Accent)
    val customBorderColor = RendererTokens.parse(theme?.borderColor, if (customMessage.context.color != null) accentColor.copy(alpha = 0.4f) else RendererTokens.Hairline)
    val customTextColor = RendererTokens.parse(theme?.textColor, ScrymeDarkTextPrimary)

    val titleText = interpolate(customMessage.context.title, formState, customMessage.data ?: emptyMap())
    val descText = customMessage.context.description?.let { interpolate(it, formState, customMessage.data ?: emptyMap()) }

    val allResponded = remember(customMessage.actionResponses, respondedActionIds) {
        val fromDto = customMessage.actionResponses?.mapNotNull { it.actionId }?.toSet() ?: emptySet()
        fromDto + respondedActionIds
    }

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = containerColor,
            contentColor = customTextColor
        ),
        shape = RoundedCornerShape(RendererTokens.RadiusOuter),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        border = BorderStroke(1.dp, customBorderColor)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    if (customMessage.context.icon != null) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
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
                        text = titleText,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 15.sp,
                        color = customTextColor,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                PriorityBadge(priority = customMessage.context.priority)
            }

            descText?.let {
                Text(
                    text = it,
                    fontSize = 12.5.sp,
                    color = ScrymeDarkTextSecondary,
                    lineHeight = 17.sp,
                    modifier = Modifier.padding(top = 4.dp, start = if (customMessage.context.icon != null) 38.dp else 0.dp)
                )
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = RendererTokens.Hairline)

            // Root Node
            MessageNodeRenderer(
                node = customMessage.root,
                formState = formState,
                onUpdateForm = onUpdateForm,
                data = customMessage.data ?: emptyMap()
            )

            // Actions
            if (!customMessage.actions.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(14.dp))
                ActionButtonsRenderer(
                    actions = customMessage.actions,
                    onActionTriggered = onActionTriggered,
                    isLoading = isLoading,
                    respondedActionIds = allResponded,
                    formState = formState,
                    data = customMessage.data ?: emptyMap()
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
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                node.children?.forEach { child ->
                    MessageNodeRenderer(child, formState, onUpdateForm, data)
                }
            }
        }
        "Layout.Row" -> {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
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
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                children.chunked(columns).forEach { rowChildren ->
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
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
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    node.children?.forEach { child ->
                        MessageNodeRenderer(child, formState, onUpdateForm, data)
                    }
                }
            }
        }
        "Text.Header" -> {
            val content = node.properties?.get("content") as? String ?: node.properties?.get("text") as? String ?: ""
            Text(
                text = interpolate(content, formState, data),
                color = ScrymeDarkTextPrimary,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(vertical = 4.dp)
            )
        }
        "Text.Paragraph" -> {
            val content = node.properties?.get("content") as? String ?: node.properties?.get("text") as? String ?: ""
            Text(
                text = interpolate(content, formState, data),
                color = ScrymeDarkTextSecondary,
                fontSize = 13.sp,
                lineHeight = 18.sp,
                modifier = Modifier.padding(vertical = 2.dp)
            )
        }
        "Display.Field" -> {
            val label = node.properties?.get("label") as? String ?: ""
            val value = node.properties?.get("value")?.toString() ?: ""
            Column(modifier = Modifier.padding(vertical = 2.dp)) {
                if (label.isNotEmpty()) {
                    Text(
                        text = label.uppercase(),
                        color = ScrymeDarkTextSecondary,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 0.4.sp
                    )
                }
                Text(
                    text = interpolate(value, formState, data),
                    color = ScrymeDarkTextPrimary,
                    fontSize = 13.5.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
        "Display.Badge" -> {
            val label = node.properties?.get("label") as? String ?: node.properties?.get("text") as? String ?: ""
            val colorHex = node.properties?.get("color") as? String
            val badgeColor = RendererTokens.parse(colorHex, RendererTokens.Accent)
            Surface(
                color = badgeColor.copy(alpha = 0.2f),
                shape = RoundedCornerShape(RendererTokens.RadiusChip),
                modifier = Modifier.padding(vertical = 2.dp)
            ) {
                Text(
                    text = interpolate(label, formState, data),
                    color = badgeColor,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                )
            }
        }
        "Display.Avatar" -> {
            val url = node.properties?.get("url") as? String ?: node.properties?.get("src") as? String
            val name = node.properties?.get("name") as? String ?: "User"
            UserAvatar(name = name, avatarUrl = url, size = 32.dp)
        }
        "Display.Image" -> {
            val url = node.properties?.get("url") as? String ?: node.properties?.get("src") as? String ?: ""
            if (url.isNotEmpty()) {
                AsyncImage(
                    model = url,
                    contentDescription = null,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 200.dp)
                        .clip(RoundedCornerShape(RendererTokens.RadiusInner))
                        .padding(vertical = 4.dp),
                    contentScale = ContentScale.Crop
                )
            }
        }
        "Input.Text" -> {
            val id = node.id ?: ""
            val label = node.properties?.get("label") as? String ?: ""
            val placeholder = node.properties?.get("placeholder") as? String ?: ""
            val multiline = node.properties?.get("multiline") as? Boolean ?: false
            val currentValue = formState[id]?.toString() ?: ""

            Column(modifier = Modifier.padding(vertical = 4.dp)) {
                if (label.isNotEmpty()) {
                    Text(
                        text = label,
                        color = ScrymeDarkTextSecondary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                }
                OutlinedTextField(
                    value = currentValue,
                    onValueChange = { onUpdateForm(id, it) },
                    placeholder = { Text(placeholder, fontSize = 13.sp, color = ScrymeDarkTextSecondary.copy(alpha = 0.6f)) },
                    singleLine = !multiline,
                    maxLines = if (multiline) 4 else 1,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(RendererTokens.RadiusInner),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = RendererTokens.Accent,
                        unfocusedBorderColor = RendererTokens.Hairline,
                        focusedContainerColor = RendererTokens.SurfaceSunken,
                        unfocusedContainerColor = RendererTokens.SurfaceSunken,
                        focusedTextColor = ScrymeDarkTextPrimary,
                        unfocusedTextColor = ScrymeDarkTextPrimary
                    )
                )
            }
        }
        "Input.Switch" -> {
            val id = node.id ?: ""
            val label = node.properties?.get("label") as? String ?: ""
            val checked = (formState[id] as? Boolean) ?: (node.properties?.get("defaultChecked") as? Boolean) ?: false

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = label, color = ScrymeDarkTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                Switch(
                    checked = checked,
                    onCheckedChange = { onUpdateForm(id, it) },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = Color.White,
                        checkedTrackColor = RendererTokens.Accent
                    )
                )
            }
        }
        "Input.Checkbox" -> {
            val id = node.id ?: ""
            val label = node.properties?.get("label") as? String ?: ""
            val checked = (formState[id] as? Boolean) ?: false

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onUpdateForm(id, !checked) }
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Checkbox(
                    checked = checked,
                    onCheckedChange = { onUpdateForm(id, it) },
                    colors = CheckboxDefaults.colors(checkedColor = RendererTokens.Accent)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(text = label, color = ScrymeDarkTextPrimary, fontSize = 13.sp)
            }
        }
        "Input.RadioGroup" -> {
            val id = node.id ?: ""
            val label = node.properties?.get("label") as? String ?: ""
            @Suppress("UNCHECKED_CAST")
            val options = node.properties?.get("options") as? List<Map<String, Any>>
                ?: (node.properties?.get("dataSource") as? Map<String, Any>)?.get("items") as? List<Map<String, Any>>
                ?: emptyList()
            val selectedValue = formState[id]?.toString() ?: ""

            Column(modifier = Modifier.padding(vertical = 4.dp)) {
                if (label.isNotEmpty()) {
                    Text(
                        text = label,
                        color = ScrymeDarkTextSecondary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                }
                options.forEach { opt ->
                    val optLabel = opt["label"]?.toString() ?: ""
                    val optValue = opt["value"]?.toString() ?: optLabel
                    val isSelected = selectedValue == optValue

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onUpdateForm(id, optValue) }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = isSelected,
                            onClick = { onUpdateForm(id, optValue) },
                            colors = RadioButtonDefaults.colors(selectedColor = RendererTokens.Accent)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = optLabel, color = ScrymeDarkTextPrimary, fontSize = 13.sp)
                    }
                }
            }
        }
        "Input.Select" -> {
            val id = node.id ?: ""
            val label = node.properties?.get("label") as? String ?: ""
            @Suppress("UNCHECKED_CAST")
            val options = node.properties?.get("options") as? List<Map<String, Any>>
                ?: (node.properties?.get("dataSource") as? Map<String, Any>)?.get("items") as? List<Map<String, Any>>
                ?: emptyList()
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
                        modifier = Modifier.padding(bottom = 4.dp)
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
                                fontSize = 13.5.sp,
                                color = if (selectedLabel.isEmpty()) ScrymeDarkTextSecondary else ScrymeDarkTextPrimary
                            )
                            Icon(
                                imageVector = Icons.Default.KeyboardArrowDown,
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
                            val optValue = option["value"]?.toString() ?: optLabel
                            DropdownMenuItem(
                                text = { Text(optLabel, color = ScrymeDarkTextPrimary, fontSize = 13.5.sp) },
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
        "Display.Progress", "Data.ProgressBar" -> {
            val value = (node.properties?.get("value") as? Number)?.toFloat() ?: 0f
            val max = (node.properties?.get("max") as? Number)?.toFloat() ?: 100f
            val label = node.properties?.get("label") as? String

            Column(modifier = Modifier.padding(vertical = 6.dp)) {
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
                    Spacer(modifier = Modifier.height(4.dp))
                }
                LinearProgressIndicator(
                    progress = { (value / max).coerceIn(0f, 1f) },
                    modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                    color = RendererTokens.Accent,
                    trackColor = RendererTokens.NeutralMuted
                )
            }
        }
        "Data.StatsGrid" -> {
            val children = node.children ?: emptyList()
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                children.chunked(2).forEach { rowChildren ->
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
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
                Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.Start) {
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
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
        else -> {
            node.children?.forEach { child ->
                MessageNodeRenderer(child, formState, onUpdateForm, data)
            }
        }
    }
}

@Composable
fun ActionButtonsRenderer(
    actions: List<MessageActionDto>,
    onActionTriggered: (MessageActionDto) -> Unit,
    isLoading: Boolean = false,
    respondedActionIds: Set<String> = emptySet(),
    formState: Map<String, Any> = emptyMap(),
    data: Map<String, Any> = emptyMap()
) {
    val visibleActions = actions.filter { evaluateCondition(it.condition, formState, data) }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        visibleActions.forEach { action ->
            val allowMultiple = action.allowMultipleResponses ?: action.allowMultiple ?: false
            val isResponded = respondedActionIds.contains(action.id)
            val isDisabled = (isResponded && !allowMultiple) || isLoading

            val (containerColor, contentColor, border) = when {
                isResponded && !allowMultiple -> Triple(RendererTokens.SurfaceSunken, ScrymeDarkTextSecondary, BorderStroke(1.dp, RendererTokens.Hairline))
                action.type == "PRIMARY" -> Triple(RendererTokens.Accent, Color.White, null)
                action.type == "DESTRUCTIVE" -> Triple(RendererTokens.Destructive, Color.White, null)
                action.type == "GHOST" -> Triple(Color.Transparent, ScrymeDarkTextSecondary, BorderStroke(1.dp, RendererTokens.Hairline))
                else -> Triple(RendererTokens.SurfaceRaised, ScrymeDarkTextPrimary, BorderStroke(1.dp, RendererTokens.Hairline))
            }

            val labelText = interpolate(action.label, formState, data)

            Button(
                onClick = { onActionTriggered(action) },
                enabled = !isDisabled,
                colors = ButtonDefaults.buttonColors(
                    containerColor = containerColor,
                    contentColor = contentColor,
                    disabledContainerColor = containerColor.copy(alpha = 0.5f),
                    disabledContentColor = contentColor.copy(alpha = 0.7f)
                ),
                border = border,
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp, pressedElevation = 0.dp),
                modifier = Modifier.weight(1f).height(38.dp),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                shape = RoundedCornerShape(RendererTokens.RadiusInner)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(14.dp),
                        color = contentColor,
                        strokeWidth = 2.dp
                    )
                } else {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (isResponded && !allowMultiple) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                                tint = Color(0xFF28C76F)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                        }
                        Text(
                            text = if (isResponded && !allowMultiple) "$labelText (Submitted)" else labelText,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
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
        if (key.isNotEmpty() && value != null) {
            result = result.replace("{{$key}}", value.toString())
        }
    }
    return result
}
