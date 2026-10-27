package com.scrymechat.android.ui.components

import androidx.compose.foundation.text.ClickableText
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.sp
import com.scrymechat.android.ui.theme.ScrymeDarkTextPrimary

/**
 * A basic markdown renderer that supports clickable mentions and channel tags.
 */
@Composable
fun MarkdownText(
    content: String,
    modifier: Modifier = Modifier,
    color: androidx.compose.ui.graphics.Color = ScrymeDarkTextPrimary,
    onMentionClick: (String) -> Unit = {},
    onChannelTagClick: (String) -> Unit = {}
) {
    val annotatedString = buildAnnotatedString {
        val combinedRegex = """(\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`|@([\w.]+)|#(\w+))""".toRegex()
        var lastIndex = 0

        combinedRegex.findAll(content).forEach { match ->
            if (match.range.first < lastIndex) {
                return@forEach
            }

            if (match.range.first > lastIndex) {
                append(content.substring(lastIndex, match.range.first))
            }

            val boldText = match.groups[2]?.value
            val italicText = match.groups[3]?.value
            val codeText = match.groups[4]?.value
            val mentionTag = match.groups[5]?.value
            val channelTag = match.groups[6]?.value

            when {
                boldText != null -> {
                    withStyle(style = SpanStyle(fontWeight = FontWeight.Bold)) {
                        append(boldText)
                    }
                }
                italicText != null -> {
                    withStyle(style = SpanStyle(fontStyle = FontStyle.Italic)) {
                        append(italicText)
                    }
                }
                codeText != null -> {
                    withStyle(style = SpanStyle(fontFamily = FontFamily.Monospace, background = androidx.compose.ui.graphics.Color.DarkGray.copy(alpha = 0.5f))) {
                        append(codeText)
                    }
                }
                mentionTag != null -> {
                    val start = length
                    withStyle(style = SpanStyle(
                        fontWeight = FontWeight.Bold,
                        color = androidx.compose.ui.graphics.Color(0xFF818CF8),
                        background = androidx.compose.ui.graphics.Color(0xFF818CF8).copy(alpha = 0.15f)
                    )) {
                        append(match.value)
                    }
                    val end = length
                    addStringAnnotation(
                        tag = "mention",
                        annotation = mentionTag,
                        start = start,
                        end = end
                    )
                }
                channelTag != null -> {
                    val start = length
                    withStyle(style = SpanStyle(
                        fontWeight = FontWeight.Bold,
                        color = androidx.compose.ui.graphics.Color(0xFF818CF8),
                        background = androidx.compose.ui.graphics.Color(0xFF818CF8).copy(alpha = 0.15f)
                    )) {
                        append(match.value)
                    }
                    val end = length
                    addStringAnnotation(
                        tag = "channel",
                        annotation = channelTag,
                        start = start,
                        end = end
                    )
                }
                else -> {
                    append(match.value)
                }
            }
            lastIndex = match.range.last + 1
        }

        if (lastIndex < content.length) {
            append(content.substring(lastIndex))
        }
    }

    ClickableText(
        text = annotatedString,
        modifier = modifier,
        style = MaterialTheme.typography.bodyMedium.copy(fontSize = 14.sp, lineHeight = 19.sp, color = color),
        onClick = { offset ->
            annotatedString.getStringAnnotations(tag = "mention", start = offset, end = offset)
                .firstOrNull()?.let { annotation ->
                    onMentionClick(annotation.item)
                }
            annotatedString.getStringAnnotations(tag = "channel", start = offset, end = offset)
                .firstOrNull()?.let { annotation ->
                    onChannelTagClick(annotation.item)
                }
        }
    )
}
