package com.scrymechat.android.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.scrymechat.android.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyAccountScreen(onBack: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Account", color = ScrymeDarkTextPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = ScrymeDarkTextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ScrymeDarkSurface)
            )
        },
        containerColor = ScrymeDarkBackground
    ) { padding ->
        LazyColumn(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            item {
                Text("ACCOUNT INFORMATION", color = ScrymeDarkTextSecondary, style = MaterialTheme.typography.labelMedium)
                Spacer(modifier = Modifier.height(16.dp))
                AccountInfoItem("Username", "scryme_user")
                AccountInfoItem("Email", "user@example.com")
                AccountInfoItem("Phone Number", "Not added")
            }
            item {
                Spacer(modifier = Modifier.height(24.dp))
                Text("PASSWORD AND AUTHENTICATION", color = ScrymeDarkTextSecondary, style = MaterialTheme.typography.labelMedium)
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = {},
                    colors = ButtonDefaults.buttonColors(containerColor = ScrymeDarkAccent),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Change Password")
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VoiceSettingsScreen(onBack: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Voice", color = ScrymeDarkTextPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = ScrymeDarkTextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ScrymeDarkSurface)
            )
        },
        containerColor = ScrymeDarkBackground
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            Text("INPUT MODE", color = ScrymeDarkTextSecondary, style = MaterialTheme.typography.labelMedium)
            Spacer(modifier = Modifier.height(16.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                RadioButton(selected = true, onClick = {})
                Text("Voice Activity", color = ScrymeDarkTextPrimary)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                RadioButton(selected = false, onClick = {})
                Text("Push to Talk", color = ScrymeDarkTextPrimary)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LanguageSettingsScreen(onBack: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Language", color = ScrymeDarkTextPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = ScrymeDarkTextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ScrymeDarkSurface)
            )
        },
        containerColor = ScrymeDarkBackground
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            Text("English (US)", color = ScrymeDarkTextPrimary, modifier = Modifier.padding(vertical = 8.dp))
            Text("English (UK)", color = ScrymeDarkTextPrimary, modifier = Modifier.padding(vertical = 8.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthorizedAppsScreen(onBack: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Authorized Apps", color = ScrymeDarkTextPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = ScrymeDarkTextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ScrymeDarkSurface)
            )
        },
        containerColor = ScrymeDarkBackground
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            Text("No apps authorized yet.", color = ScrymeDarkTextSecondary)
        }
    }
}

@Composable
fun AccountInfoItem(label: String, value: String) {
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        Text(label, color = ScrymeDarkTextSecondary, style = MaterialTheme.typography.bodySmall)
        Text(value, color = ScrymeDarkTextPrimary, style = MaterialTheme.typography.bodyLarge)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserProfileScreen(onBack: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("User Profile", color = ScrymeDarkTextPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = ScrymeDarkTextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ScrymeDarkSurface)
            )
        },
        containerColor = ScrymeDarkBackground
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            Text("Preview and edit your global profile.", color = ScrymeDarkTextSecondary)
            Spacer(modifier = Modifier.height(24.dp))
            Button(onClick = {}, modifier = Modifier.fillMaxWidth()) {
                Text("Edit Avatar")
            }
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = {}, modifier = Modifier.fillMaxWidth()) {
                Text("Edit Profile Theme")
            }
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedTextField(
                value = "",
                onValueChange = {},
                label = { Text("About Me") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = ScrymeDarkTextPrimary,
                    unfocusedTextColor = ScrymeDarkTextPrimary,
                    cursorColor = ScrymeDarkAccent
                )
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrivacySafetyScreen(onBack: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Privacy & Safety", color = ScrymeDarkTextPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = ScrymeDarkTextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ScrymeDarkSurface)
            )
        },
        containerColor = ScrymeDarkBackground
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            Text("DIRECT MESSAGE SAFETY", color = ScrymeDarkTextSecondary, style = MaterialTheme.typography.labelMedium)
            Spacer(modifier = Modifier.height(16.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Allow direct messages from server members", color = ScrymeDarkTextPrimary, modifier = Modifier.weight(1f))
                Switch(checked = true, onCheckedChange = {})
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppearanceSettingsScreen(onBack: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Appearance", color = ScrymeDarkTextPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = ScrymeDarkTextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ScrymeDarkSurface)
            )
        },
        containerColor = ScrymeDarkBackground
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            Text("THEME", color = ScrymeDarkTextSecondary, style = MaterialTheme.typography.labelMedium)
            Spacer(modifier = Modifier.height(16.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                RadioButton(selected = true, onClick = {})
                Text("Dark", color = ScrymeDarkTextPrimary)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                RadioButton(selected = false, onClick = {})
                Text("Light", color = ScrymeDarkTextPrimary)
            }
        }
    }
}
