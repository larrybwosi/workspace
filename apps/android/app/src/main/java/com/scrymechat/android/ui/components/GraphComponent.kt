package com.scrymechat.android.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.scrymechat.android.ui.theme.ScrymeDarkAccent
import com.scrymechat.android.ui.theme.ScrymeDarkSurface
import com.scrymechat.android.ui.theme.ScrymeDarkTextPrimary

@Composable
fun GraphComponent(
    title: String,
    data: List<Float>,
    labels: List<String>,
    modifier: Modifier = Modifier
) {
    var selectedIndex by remember { mutableIntStateOf(-1) }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(ScrymeDarkSurface)
            .padding(12.dp)
    ) {
        Text(
            text = title,
            color = ScrymeDarkTextPrimary,
            fontWeight = FontWeight.Bold,
            fontSize = 16.sp,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .height(150.dp)
                .pointerInput(data) {
                    detectTapGestures { offset ->
                        val stepX = size.width / (data.size - 1).coerceAtLeast(1)
                        val index = (offset.x / stepX).toInt().coerceIn(0, data.size - 1)
                        selectedIndex = index
                    }
                }
        ) {
            if (data.isEmpty()) return@Canvas

            val maxVal = data.maxOrNull() ?: 1f
            val minVal = data.minOrNull() ?: 0f
            val range = maxVal - minVal
            val effectiveRange = if (range == 0f) 1f else range

            val width = size.width
            val height = size.height
            val stepX = width / (data.size - 1).coerceAtLeast(1)

            val path = Path()
            data.forEachIndexed { index, value ->
                val x = index * stepX
                val y = height - ((value - minVal) / effectiveRange * height)
                if (index == 0) {
                    path.moveTo(x, y)
                } else {
                    path.lineTo(x, y)
                }
            }

            drawPath(
                path = path,
                color = ScrymeDarkAccent,
                style = Stroke(width = 3.dp.toPx())
            )

            // Draw points
            data.forEachIndexed { index, value ->
                val x = index * stepX
                val y = height - ((value - minVal) / effectiveRange * height)
                drawCircle(
                    color = if (selectedIndex == index) Color.Yellow else Color.White,
                    radius = if (selectedIndex == index) 6.dp.toPx() else 4.dp.toPx(),
                    center = Offset(x, y)
                )
            }
        }

        if (selectedIndex != -1) {
            Text(
                text = "Value: ${data[selectedIndex]}${if (labels.size > selectedIndex) " (${labels[selectedIndex]})" else ""}",
                color = ScrymeDarkAccent,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 8.dp)
            )
        }
    }
}
