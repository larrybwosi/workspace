package com.scrymechat.android.data.remote

import com.scrymechat.android.data.local.SessionManager
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import javax.inject.Provider

class ApiUrlInterceptorTest {

    private lateinit var mockWebServer: MockWebServer
    private lateinit var sessionManager: SessionManager
    private lateinit var sessionManagerProvider: Provider<SessionManager>
    private lateinit var client: OkHttpClient

    @Before
    fun setup() {
        mockWebServer = MockWebServer()
        mockWebServer.start()

        sessionManager = mock()
        sessionManagerProvider = Provider { sessionManager }

        val interceptor = ApiUrlInterceptor(sessionManagerProvider)
        client = OkHttpClient.Builder()
            .addInterceptor(interceptor)
            .build()
    }

    @After
    fun teardown() {
        mockWebServer.shutdown()
    }

    @Test
    fun `interceptor updates request url when custom url is set`() {
        val customUrl = mockWebServer.url("/").toString().removeSuffix("/")
        doReturn(customUrl).whenever(sessionManager).getApiUrl()

        mockWebServer.enqueue(MockResponse().setBody("ok"))

        val request = Request.Builder()
            .url("http://localhost:3000/api/test")
            .build()

        client.newCall(request).execute()

        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("/api/test", recordedRequest.path)
        assertEquals(mockWebServer.hostName, recordedRequest.requestUrl?.host)
        assertEquals(mockWebServer.port, recordedRequest.requestUrl?.port)
    }

    @Test
    fun `interceptor does not update request url when custom url is not set`() {
        doReturn(null).whenever(sessionManager).getApiUrl()

        // We can't easily test that it DOES NOT change to something else without another server
        // but we can check if it proceeds with the original one.
        // Since we don't have a server at localhost:3000, we expect a failure or we can use another mock server URL as "original"

        val originalUrl = mockWebServer.url("/").toString()
        mockWebServer.enqueue(MockResponse().setBody("ok"))

        val request = Request.Builder()
            .url(originalUrl)
            .build()

        client.newCall(request).execute()

        val recordedRequest = mockWebServer.takeRequest()
        assertEquals(originalUrl, recordedRequest.requestUrl.toString())
    }
}
