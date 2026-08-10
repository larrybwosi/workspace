package com.scrymechat.android.data.local

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.scrymechat.android.data.local.dao.SessionDao
import com.scrymechat.android.data.local.dao.UserDao
import com.scrymechat.android.data.local.dao.WorkspaceMemberDao
import com.scrymechat.android.data.local.entities.SessionEntity
import com.scrymechat.android.data.local.entities.UserEntity
import com.scrymechat.android.data.local.entities.WorkspaceMemberEntity
import dagger.hilt.android.qualifiers.ApplicationContext
import android.content.SharedPreferences
import android.os.Build
import android.util.Log
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import java.io.File
import java.security.KeyStore
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionManager @Inject constructor(
    @ApplicationContext context: Context,
    private val sessionDao: SessionDao,
    private val userDao: UserDao,
    private val workspaceMemberDao: WorkspaceMemberDao
) {
    private val sharedPreferences: SharedPreferences = try {
        createEncryptedSharedPreferences(context)
    } catch (e: Exception) {
        Log.e("SessionManager", "Failed to initialize EncryptedSharedPreferences, attempting recovery...", e)
        try {
            deleteEncryptedSharedPreferencesAndKey(context)
            createEncryptedSharedPreferences(context)
        } catch (ex: Exception) {
            Log.e("SessionManager", "Recovery failed. Falling back to standard unencrypted SharedPreferences...", ex)
            context.getSharedPreferences("scrymechat_prefs_fallback", Context.MODE_PRIVATE)
        }
    }

    private fun createEncryptedSharedPreferences(context: Context): SharedPreferences {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        return EncryptedSharedPreferences.create(
            context,
            "scrymechat_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    private fun deleteEncryptedSharedPreferencesAndKey(context: Context) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                context.deleteSharedPreferences("scrymechat_prefs")
            } else {
                context.getSharedPreferences("scrymechat_prefs", Context.MODE_PRIVATE).edit().clear().commit()
                val file = File(context.filesDir.parent, "shared_prefs/scrymechat_prefs.xml")
                if (file.exists()) {
                    file.delete()
                }
            }
        } catch (e: Exception) {
            Log.e("SessionManager", "Error deleting scrymechat_prefs SharedPreferences file", e)
        }

        try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore")
            keyStore.load(null)
            keyStore.deleteEntry(MasterKey.DEFAULT_MASTER_KEY_ALIAS)
        } catch (e: Exception) {
            Log.e("SessionManager", "Error deleting MasterKey from KeyStore", e)
        }
    }

    private var pendingDeepLinkRoute: String? = null

    fun savePendingDeepLinkRoute(route: String?) {
        pendingDeepLinkRoute = route
    }

    fun getPendingDeepLinkRoute(): String? {
        val route = pendingDeepLinkRoute
        pendingDeepLinkRoute = null
        return route
    }

    fun saveToken(token: String) {
        sharedPreferences.edit().putString("auth_token", token).apply()
    }

    fun getToken(): String? {
        return sharedPreferences.getString("auth_token", null)
    }

    fun saveFcmToken(token: String) {
        sharedPreferences.edit().putString("fcm_token", token).apply()
    }

    fun getFcmToken(): String? {
        return sharedPreferences.getString("fcm_token", null)
    }

    fun saveThemePreference(theme: String) {
        sharedPreferences.edit().putString("theme_preference", theme).apply()
    }

    fun getThemePreference(): String {
        return sharedPreferences.getString("theme_preference", "system") ?: "system"
    }

    fun saveVoiceMode(mode: String) {
        sharedPreferences.edit().putString("voice_mode", mode).apply()
    }

    fun getVoiceMode(): String {
        return sharedPreferences.getString("voice_mode", "voice_activity") ?: "voice_activity"
    }

    fun saveLanguage(language: String) {
        sharedPreferences.edit().putString("language_preference", language).apply()
    }

    fun getLanguage(): String {
        return sharedPreferences.getString("language_preference", "en_us") ?: "en_us"
    }

    fun saveApiUrl(url: String) {
        sharedPreferences.edit().putString("custom_api_url", url).apply()
    }

    fun getApiUrl(): String? {
        return sharedPreferences.getString("custom_api_url", null)
    }

    fun getApiUrlFlow(): Flow<String?> = callbackFlow {
        val listener = SharedPreferences.OnSharedPreferenceChangeListener { prefs, key ->
            if (key == "custom_api_url") {
                trySend(prefs.getString(key, null))
            }
        }
        sharedPreferences.registerOnSharedPreferenceChangeListener(listener)
        trySend(getApiUrl())
        awaitClose { sharedPreferences.unregisterOnSharedPreferenceChangeListener(listener) }
    }

    suspend fun isLoggedIn(): Boolean {
        return getToken() != null && getActiveSession() != null
    }

    suspend fun saveSession(
        session: SessionEntity,
        user: UserEntity,
        memberships: List<WorkspaceMemberEntity>
    ) {
        sessionDao.insertSession(session)
        userDao.insertUser(user)
        workspaceMemberDao.insertMembers(memberships)
    }

    fun getActiveSessionFlow(): Flow<SessionEntity?> = sessionDao.getActiveSessionFlow()

    suspend fun getActiveSession(): SessionEntity? = sessionDao.getActiveSession()

    fun getUserFlow(userId: String): Flow<UserEntity?> = userDao.getUserByIdFlow(userId)

    suspend fun updateActiveWorkspace(workspaceId: String?) {
        sessionDao.updateActiveWorkspace(workspaceId)
    }

    suspend fun clearSession() {
        sharedPreferences.edit().remove("auth_token").apply()
        sessionDao.clear()
        userDao.deleteAll()
        workspaceMemberDao.deleteAll()
    }
}
