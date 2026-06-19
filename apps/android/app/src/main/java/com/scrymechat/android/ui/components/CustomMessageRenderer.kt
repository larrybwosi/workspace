package com.scrymechat.android.ui.components

import androidx.compose.foundation.background
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.scrymechat.android.data.remote.*
import com.scrymechat.android.ui.theme.*

@Composable
fun CustomMessageRenderer(
    customMessage: CustomMessageDto,
    formState: Map<String, Any>,
    onUpdateForm: (String, Any) -> Unit,
    onActionTriggered: (MessageActionDto) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = ScrymeDarkSurface,
            contentColor = ScrymeDarkTextPrimary
        ),
        shape = RoundedCornerShape(12.dp),
        border = customMessage.context.color?.let {
            val color = try { Color(android.graphics.Color.parseColor(it)) } catch (e: Exception) { ScrymeDarkAccent }
            ButtonDefaults.outlinedButtonBorder.copy(brush = androidx.compose.ui.graphics.SolidColor(color))
        }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (customMessage.context.icon != null) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = ScrymeDarkAccent,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text(
                    text = customMessage.context.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = ScrymeDarkTextPrimary
                )
            }

            customMessage.context.description?.let {
                Text(
                    text = it,
                    fontSize = 14.sp,
                    color = ScrymeDarkTextSecondary,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Color.Gray.copy(alpha = 0.2f))

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
                    onActionTriggered = onActionTriggered
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
                color = Color.Gray.copy(alpha = 0.1f),
                shape = RoundedCornerShape(8.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    node.children?.forEach { child ->
                        MessageNodeRenderer(child, formState, onUpdateForm, data)
                    }
                }
            }
        }
        "Text.Paragraph" -> {
            val content = node.properties?.get("content") as? String ?: ""
            Text(text = interpolate(content, formState, data), color = ScrymeDarkTextPrimary, fontSize = 14.sp)
        }
        "Text.Heading" -> {
            val content = node.properties?.get("content") as? String ?: ""
            val level = (node.properties?.get("level") as? Number)?.toInt() ?: 1
            Text(
                text = interpolate(content, formState, data),
                color = ScrymeDarkTextPrimary,
                fontWeight = FontWeight.Bold,
                fontSize = if (level == 1) 20.sp else if (level == 2) 18.sp else 16.sp,
                modifier = Modifier.padding(vertical = 4.dp)
            )
        }
        "Display.Field" -> {
            val label = node.properties?.get("label") as? String ?: ""
            val value = node.properties?.get("value")?.toString() ?: ""
            Column(modifier = Modifier.padding(vertical = 4.dp)) {
                Text(text = label, color = ScrymeDarkTextSecondary, fontSize = 12.sp)
                Text(text = interpolate(value, formState, data), color = ScrymeDarkTextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
            }
        }
        "Display.Badge" -> {
            val label = node.properties?.get("label") as? String ?: ""
            val colorStr = node.properties?.get("color") as? String
            val color = try { Color(android.graphics.Color.parseColor(colorStr)) } catch (e: Exception) { ScrymeDarkAccent }

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .background(color.copy(alpha = 0.2f))
                    .padding(horizontal = 8.dp, vertical = 2.dp)
            ) {
                Text(text = label, color = color, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }
        "Input.Text" -> {
            val id = node.id ?: return
            val label = node.properties?.get("label") as? String ?: ""
            val placeholder = node.properties?.get("placeholder") as? String ?: ""
            val value = formState[id] as? String ?: ""

            Column(modifier = Modifier.padding(vertical = 4.dp)) {
                Text(text = label, color = ScrymeDarkTextSecondary, fontSize = 12.sp, modifier = Modifier.padding(bottom = 4.dp))
                TextField(
                    value = value,
                    onValueChange = { onUpdateForm(id, it) },
                    placeholder = { Text(placeholder, fontSize = 14.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = ScrymeDarkBackground,
                        unfocusedContainerColor = ScrymeDarkBackground,
                        focusedTextColor = ScrymeDarkTextPrimary,
                        unfocusedTextColor = ScrymeDarkTextPrimary
                    ),
                    singleLine = true
                )
            }
        }
        "Input.Switch" -> {
            val id = node.id ?: return
            val label = node.properties?.get("label") as? String ?: ""
            val checked = formState[id] as? Boolean ?: false

            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = label, color = ScrymeDarkTextPrimary, fontSize = 14.sp)
                Switch(
                    checked = checked,
                    onCheckedChange = { onUpdateForm(id, it) }
                )
            }
        }
        "Input.Checkbox" -> {
            val id = node.id ?: return
            val label = node.properties?.get("label") as? String ?: ""
            val checked = formState[id] as? Boolean ?: false

            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Checkbox(
                    checked = checked,
                    onCheckedChange = { onUpdateForm(id, it) }
                )
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
                Text(text = label, color = ScrymeDarkTextSecondary, fontSize = 12.sp, modifier = Modifier.padding(bottom = 4.dp))
                Box {
                    OutlinedButton(
                        onClick = { expanded = true },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = ScrymeDarkTextPrimary)
                    ) {
                        Text(text = selectedLabel.ifEmpty { "Select an option" })
                    }
                    DropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false },
                        modifier = Modifier.background(ScrymeDarkSurface)
                    ) {
                        options.forEach { option ->
                            val optLabel = option["label"] as? String ?: ""
                            val optValue = option["value"]?.toString() ?: ""
                            DropdownMenuItem(
                                text = { Text(optLabel, color = ScrymeDarkTextPrimary) },
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
                        Text(text = label, color = ScrymeDarkTextSecondary, fontSize = 12.sp)
                        Text(text = "${(value/max * 100).toInt()}%", color = ScrymeDarkTextSecondary, fontSize = 12.sp)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                }
                LinearProgressIndicator(
                    progress = { value / max },
                    modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                    color = ScrymeDarkAccent,
                    trackColor = Color.Gray.copy(alpha = 0.2f)
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
                color = Color.Gray.copy(alpha = 0.1f),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = label, color = ScrymeDarkTextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Text(text = interpolate(value, formState, data), color = ScrymeDarkTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
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
    onActionTriggered: (MessageActionDto) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        actions.forEach { action ->
            val color = when (action.type) {
                "PRIMARY" -> ScrymeDarkAccent
                "DESTRUCTIVE" -> Color.Red
                else -> Color.Gray
            }

            Button(
                onClick = { onActionTriggered(action) },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (action.type == "GHOST") Color.Transparent else color,
                    contentColor = if (action.type == "GHOST") color else Color.White
                ),
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(text = action.label, fontSize = 14.sp, fontWeight = FontWeight.Bold)
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
