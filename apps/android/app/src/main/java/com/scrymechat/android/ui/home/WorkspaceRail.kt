package com.scrymechat.android.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.scrymechat.android.data.local.entities.WorkspaceEntity
import com.scrymechat.android.ui.theme.ScrymeDarkAccent
import com.scrymechat.android.ui.theme.ScrymeDarkSurface
import com.scrymechat.android.ui.theme.ScrymeDarkSurfaceVariant

@Composable
fun WorkspaceRail(
    workspaces: List<WorkspaceEntity>,
    selectedWorkspace: WorkspaceEntity?,
    isHomeSelected: Boolean,
    onWorkspaceClick: (WorkspaceEntity) -> Unit,
    onHomeClick: () -> Unit,
    onCreateWorkspaceClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .width(72.dp)
            .fillMaxHeight()
            .background(ScrymeDarkBackground),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(12.dp))

        // Home Button
        WorkspaceIcon(
            isSelected = isHomeSelected,
            onClick = onHomeClick,
            content = {
                Icon(
                    imageVector = Icons.Default.Home,
                    contentDescription = "Home",
                    tint = Color.White,
                    modifier = Modifier.size(28.dp)
                )
            }
        )

        Spacer(modifier = Modifier.height(8.dp))
        Box(
            modifier = Modifier
                .width(32.dp)
                .height(2.dp)
                .background(ScrymeDarkSurfaceVariant, RoundedCornerShape(1.dp))
        )
        Spacer(modifier = Modifier.height(8.dp))

        // Workspaces List
        LazyColumn(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
        ) {
            items(workspaces, key = { it.id }) { workspace ->
                WorkspaceIcon(
                    isSelected = selectedWorkspace?.id == workspace.id,
                    onClick = { onWorkspaceClick(workspace) },
                    content = {
                        if (workspace.icon != null && workspace.icon.startsWith("http")) {
                            AsyncImage(
                                model = workspace.icon,
                                contentDescription = workspace.name,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        } else {
                            // Initial placeholder with premium gradient
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(
                                        Brush.linearGradient(
                                            listOf(Color(0xFF6366F1), Color(0xFF8B5CF6))
                                        )
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = workspace.name.take(1).uppercase(),
                                    color = Color.White,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                )
                Spacer(modifier = Modifier.height(8.dp))
            }
        }

        // Add Workspace Button
        WorkspaceIcon(
            isSelected = false,
            onClick = onCreateWorkspaceClick,
            content = {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Create Workspace",
                    tint = SidebarTokens.Accent,
                    modifier = Modifier.size(24.dp)
                )
            }
        )
        Spacer(modifier = Modifier.height(12.dp))
    }
}

@Composable
fun WorkspaceIcon(
    isSelected: Boolean,
    onClick: () -> Unit,
    content: @Composable () -> Unit
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp)
            .clickable { onClick() }
    ) {
        // Selection Indicator
        Box(
            modifier = Modifier
                .width(4.dp)
                .height(if (isSelected) 40.dp else 0.dp)
                .clip(RoundedCornerShape(topEnd = 4.dp, bottomEnd = 4.dp))
                .background(Color.White)
        )

        Spacer(modifier = Modifier.width(8.dp))

        // Icon Container
        Surface(
            modifier = Modifier
                .size(48.dp)
                .clip(if (isSelected) RoundedCornerShape(16.dp) else CircleShape),
            color = if (isSelected) ScrymeDarkAccent else ScrymeDarkSurfaceVariant
        ) {
            Box(contentAlignment = Alignment.Center) {
                content()
            }
        }

        Spacer(modifier = Modifier.width(12.dp))
    }
}

val ScrymeDarkBackground = Color(0xFF000000)
