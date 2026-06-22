package com.scrymechat.android.data.remote

import com.scrymechat.android.data.local.SessionManager
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Provider

class ApiUrlInterceptor @Inject constructor(
    private val sessionManagerProvider: Provider<SessionManager>
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        var request = chain.request()
        val customUrl = sessionManagerProvider.get().getApiUrl()

        // Only intercept requests to our own API.
        // We identify them if they are going to localhost (the default) or if they contain "/api/".
        val isAppApiRequest = request.url.host == "localhost" || request.url.encodedPath.contains("/api/")

        if (customUrl != null && isAppApiRequest) {
            val newUrl = customUrl.toHttpUrlOrNull()
            if (newUrl != null) {
                val currentUrl = request.url
                val newFullUrl = currentUrl.newBuilder()
                    .scheme(newUrl.scheme)
                    .host(newUrl.host)
                    .port(newUrl.port)
                    .build()
                request = request.newBuilder()
                    .url(newFullUrl)
                    .build()
            }
        }

        return chain.proceed(request)
    }
}
