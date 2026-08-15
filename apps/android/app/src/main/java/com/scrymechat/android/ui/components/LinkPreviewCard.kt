package com.scrymechat.android.ui.components

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.scrymechat.android.data.remote.LinkPreviewDto
import com.scrymechat.android.data.remote.MessageApi
import com.scrymechat.android.ui.chat.ChatPalette
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun LinkPreviewCard(
    url: String,
    messageApi: MessageApi?,
    palette: ChatPalette,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var previewData by remember(url) { mutableStateOf<LinkPreviewDto?>(null) }
    var isLoading by remember(url) { mutableStateOf(true) }

    LaunchedEffect(url) {
        if (messageApi != null) {
            try {
                val response = withContext(Dispatchers.IO) {
                    messageApi.getLinkPreview(url)
                }
                if (response.isSuccessful) {
                    previewData = response.body()
                }
            } catch (e: Exception) {
                // Silently ignore preview load error
            } finally {
                isLoading = false
            }
        } else {
            isLoading = false
        }
    }

    if (isLoading) {
        Surface(
            modifier = modifier
                .fillMaxWidth()
                .padding(top = 6.dp),
            shape = RoundedCornerShape(8.dp),
            color = palette.bubbleSurface,
            border = BorderStroke(1.dp, palette.bubbleBorder)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(60.dp)
                    .background(palette.bubbleSurface),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Loading preview...",
                    color = palette.textTertiary,
                    fontSize = 12.sp
                )
            }
        }
        return
    }

    val preview = previewData
    if (preview == null || (preview.title.isNullOrBlank() && preview.description.isNullOrBlank() && preview.image.isNullOrBlank())) {
        return
    }

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .padding(top = 6.dp)
            .clickable {
                try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    context.startActivity(intent)
                } catch (e: Exception) {
                    // Ignore intent failure
                }
            },
        shape = RoundedCornerShape(8.dp),
        color = palette.bubbleSurface,
        border = BorderStroke(1.dp, palette.bubbleBorder)
    ) {
        Row(modifier = Modifier.height(IntrinsicSize.Min)) {
            // Discord / WhatsApp style left accent bar
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .width(4.dp)
                    .background(palette.accent)
            )

            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(10.dp)
            ) {
                if (!preview.siteName.isNullOrBlank()) {
                    Text(
                        text = preview.siteName,
                        color = palette.textTertiary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                }

                Text(
                    text = preview.title ?: url,
                    color = palette.accent,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                if (!preview.description.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = preview.description,
                        color = palette.textSecondary,
                        fontSize = 12.5.sp,
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis,
                        lineHeight = 17.sp
                    )
                }

                if (!preview.image.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        border = BorderStroke(1.dp, palette.bubbleBorder)
                    ) {
                        AsyncImage(
                            model = preview.image,
                            contentDescription = "Link Preview Image",
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(max = 180.dp)
                                .clip(RoundedCornerShape(6.dp)),
                            contentScale = ContentScale.Crop
                        )
                    }
                }
            }
        }
    }
}
