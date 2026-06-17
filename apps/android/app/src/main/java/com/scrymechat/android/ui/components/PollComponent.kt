package com.scrymechat.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.scrymechat.android.ui.theme.ScrymeDarkAccent
import com.scrymechat.android.ui.theme.ScrymeDarkSurface
import com.scrymechat.android.ui.theme.ScrymeDarkTextPrimary
import com.scrymechat.android.ui.theme.ScrymeDarkTextSecondary

@Composable
fun PollComponent(
    question: String,
    options: List<PollOption>,
    totalVotes: Int,
    selectedOptionId: String? = null,
    onOptionClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(ScrymeDarkSurface)
            .padding(12.dp)
    ) {
        Text(
            text = question,
            color = ScrymeDarkTextPrimary,
            fontWeight = FontWeight.Bold,
            fontSize = 16.sp,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        options.forEach { option ->
            val progress = if (totalVotes > 0) option.votes.toFloat() / totalVotes else 0f

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(4.dp))
                    .background(if (selectedOptionId == option.id) ScrymeDarkAccent.copy(alpha = 0.1f) else Color.Transparent)
                    .clickable { onOptionClick(option.id) }
                    .padding(vertical = 4.dp, horizontal = 4.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = option.text, color = ScrymeDarkTextPrimary, fontSize = 14.sp)
                    Text(text = "${(progress * 100).toInt()}%", color = ScrymeDarkTextSecondary, fontSize = 12.sp)
                }
                Spacer(modifier = Modifier.height(4.dp))
                LinearProgressIndicator(
                    progress = progress,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    color = ScrymeDarkAccent,
                    trackColor = Color.Gray.copy(alpha = 0.3f)
                )
            }
        }

        Text(
            text = "$totalVotes votes",
            color = ScrymeDarkTextSecondary,
            fontSize = 12.sp,
            modifier = Modifier.padding(top = 8.dp)
        )
    }
}

data class PollOption(
    val id: String,
    val text: String,
    val votes: Int
)
