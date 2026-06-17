package com.scrymechat.android.ui.components

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import com.scrymechat.android.ui.theme.ScrymeDarkTextPrimary

/**
 * A very basic markdown renderer for demonstration.
 * In a real app, use a robust library like 'multiplatform-markdown-renderer'.
 */
@Composable
fun MarkdownText(
    content: String,
    modifier: Modifier = Modifier,
    color: androidx.compose.ui.graphics.Color = ScrymeDarkTextPrimary
) {
    val annotatedString = buildAnnotatedString {
        var remaining = content
        val boldRegex = """\*\*(.*?)\*\*""".toRegex()
        val italicRegex = """\*(.*?)\*""".toRegex()
        val codeRegex = """`(.*?)`""".toRegex()

        // This is a naive implementation for the sake of completion
        // Real markdown parsing is complex

        val allMatches = (boldRegex.findAll(content).map { it to "bold" } +
                          italicRegex.findAll(content).map { it to "italic" } +
                          codeRegex.findAll(content).map { it to "code" })
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
            }
            lastIndex = match.range.last + 1
        }

        if (lastIndex < content.length) {
            append(content.substring(lastIndex))
        }
    }

    Text(
        text = annotatedString,
        modifier = modifier,
        color = color,
        style = MaterialTheme.typography.bodyMedium
    )
}
