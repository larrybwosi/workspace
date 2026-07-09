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
        val boldRegex = """\*\*(.*?)\*\*""".toRegex()
        val italicRegex = """\*(.*?)\*""".toRegex()
        val codeRegex = """`(.*?)`""".toRegex()
        val mentionRegex = """@([\w.]+)""".toRegex()
        val channelRegex = """#(\w+)""".toRegex()

        val allMatches = (boldRegex.findAll(content).map { it to "bold" } +
                          italicRegex.findAll(content).map { it to "italic" } +
                          codeRegex.findAll(content).map { it to "code" } +
                          mentionRegex.findAll(content).map { it to "mention" } +
                          channelRegex.findAll(content).map { it to "channel" })
                          .sortedBy { it.first.range.first }

        var lastIndex = 0
        allMatches.forEach { (match, type) ->
            if (match.range.first > lastIndex) {
                append(content.substring(lastIndex, match.range.first))
            }

            when (type) {
                "bold" -> {
                    withStyle(style = SpanStyle(fontWeight = FontWeight.Bold)) {
                        append(match.groupValues[1])
                    }
                }
                "italic" -> {
                    withStyle(style = SpanStyle(fontStyle = FontStyle.Italic)) {
                        append(match.groupValues[1])
                    }
                }
                "code" -> {
                    withStyle(style = SpanStyle(fontFamily = FontFamily.Monospace, background = androidx.compose.ui.graphics.Color.DarkGray.copy(alpha = 0.5f))) {
                        append(match.groupValues[1])
                    }
                }
                "mention" -> {
                    val start = length
                    withStyle(style = SpanStyle(
                        fontWeight = FontWeight.Bold,
                        color = androidx.compose.ui.graphics.Color(0xFF818CF8), // Palette accent
                        background = androidx.compose.ui.graphics.Color(0xFF818CF8).copy(alpha = 0.15f)
                    )) {
                        append(match.value)
                    }
                    val end = length
                    addStringAnnotation(
                        tag = "mention",
                        annotation = match.groupValues[1],
                        start = start,
                        end = end
                    )
                }
                "channel" -> {
                    val start = length
                    withStyle(style = SpanStyle(
                        fontWeight = FontWeight.Bold,
                        color = androidx.compose.ui.graphics.Color(0xFF818CF8), // Palette accent
                        background = androidx.compose.ui.graphics.Color(0xFF818CF8).copy(alpha = 0.15f)
                    )) {
                        append(match.value)
                    }
                    val end = length
                    addStringAnnotation(
                        tag = "channel",
                        annotation = match.groupValues[1],
                        start = start,
                        end = end
                    )
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
        style = MaterialTheme.typography.bodyLarge.copy(fontSize = 16.sp, color = color),
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
