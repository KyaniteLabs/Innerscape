// innerscape-mobile/widgets/android/InnerscapeWidget.kt
package com.innerscape.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import com.innerscape.R

/**
 * APEX Contract: Android Widget
 * Purpose: Display real-time mood and energy on Home Screen
 */

class InnerscapeWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }
}

internal fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
    val views = RemoteViews(context.packageName, R.layout.innerscape_widget)
    
    // In production, fetch from SharedPreferences populated by main app
    views.setTextViewText(R.id.widget_title, "Innerscape")
    views.setTextViewText(R.id.widget_mood, "😊")
    views.setTextViewText(R.id.widget_valence, "Pleasant")
    views.setTextViewText(R.id.widget_energy, "High Energy")
    
    appWidgetManager.updateAppWidget(appWidgetId, views)
}
