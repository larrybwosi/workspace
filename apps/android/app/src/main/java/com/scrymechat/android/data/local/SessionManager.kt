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
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionManager @Inject constructor(
    @ApplicationContext context: Context,
    private val sessionDao: SessionDao,
    private val userDao: UserDao,
    private val workspaceMemberDao: WorkspaceMemberDao
) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "scrymechat_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

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
