// innerscape-mobile/widgets/ios/InnerscapeWidget.swift
import WidgetKit
import SwiftUI

/**
 * APEX Contract: iOS Widget
 * Purpose: Display real-time mood and energy on Home Screen
 */

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), mood: "😊", energy: "High", valence: "Pleasant")
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), mood: "😊", energy: "High", valence: "Pleasant")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        // In production, this would fetch from App Groups shared defaults
        let entries = [SimpleEntry(date: Date(), mood: "😊", energy: "High", valence: "Pleasant")]
        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let mood: String
    let energy: String
    let valence: String
}

struct InnerscapeWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Innerscape")
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.indigo)
            
            Spacer()
            
            Text(entry.mood)
                .font(.system(size: 32))
            
            VStack(alignment: .leading) {
                Text(entry.valence)
                    .font(.system(size: 14, weight: .semibold))
                Text("\(entry.energy) Energy")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(uiColor: .systemBackground))
    }
}

@main
struct InnerscapeWidget: Widget {
    let kind: String = "InnerscapeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            InnerscapeWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Innerscape Status")
        .description("Quickly view your current state.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
