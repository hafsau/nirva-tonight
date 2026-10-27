import SwiftUI

/// Energy against her own usual Friday, drawn as a line with no numbers. The
/// paused half hour is a gap in the line, not an interpolation.
struct DayArcShape: View {
    let points: [ArcPoint.Partial]
    let paused: [Span.Partial]
    var removed: [Span.Partial] = []
    let marks: [Mark.Partial]

    private let start = 7.0 * 60, end = 22.0 * 60

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.xs) {
            GeometryReader { geo in
                let w = geo.size.width, h = geo.size.height
                let x = { (at: String) in 6 + (Self.minutes(at) - start) / (end - start) * (w - 12) }
                let y = { (level: Double) in h / 2 - level * (h / 2 - 14) }
                ZStack(alignment: .topLeading) {
                    Path { p in
                        p.move(to: CGPoint(x: 6, y: h / 2))
                        p.addLine(to: CGPoint(x: w - 6, y: h / 2))
                    }
                    .stroke(Tokens.ColorToken.hairline, style: StrokeStyle(lineWidth: 1, dash: [2, 5]))

                    ForEach(Array(paused.enumerated()), id: \.offset) { _, gap in
                        if let from = gap.from, let to = gap.to {
                            RoundedRectangle(cornerRadius: 6)
                                .fill(Tokens.ColorToken.pause.opacity(0.4))
                                .frame(width: x(to) - x(from), height: h - 20)
                                .offset(x: x(from), y: 10)
                        }
                    }

                    ForEach(Array(removed.enumerated()), id: \.offset) { _, gap in
                        if let from = gap.from, let to = gap.to {
                            RoundedRectangle(cornerRadius: 6)
                                .strokeBorder(Tokens.ColorToken.pause, style: StrokeStyle(lineWidth: 1, dash: [3, 4]))
                                .frame(width: x(to) - x(from), height: h - 20)
                                .offset(x: x(from), y: 10)
                        }
                    }

                    ForEach(Array(segments.enumerated()), id: \.offset) { _, seg in
                        Path { p in
                            let pts = seg.map { CGPoint(x: x($0.at ?? "07:00"), y: y($0.level ?? 0)) }
                            Self.smooth(pts, into: &p)
                        }
                        .stroke(Tokens.ColorToken.deep, style: StrokeStyle(lineWidth: 2, lineCap: .round))
                    }

                    ForEach(Array(marks.enumerated()), id: \.offset) { _, m in
                        if let at = m.at, let pt = points.first(where: { $0.at == at }) {
                            Circle()
                                .fill(Tokens.ColorToken.surface)
                                .overlay(Circle().stroke(Tokens.ColorToken.deep, lineWidth: 1.5))
                                .frame(width: 8, height: 8)
                                .position(x: x(at), y: y(pt.level ?? 0))
                        }
                    }
                }
            }
            .frame(height: 104)

            HStack {
                ForEach(["7 AM", "12 PM", "5 PM", "10 PM"], id: \.self) { t in
                    Text(t).typeStyle(.caption).foregroundStyle(Tokens.ColorToken.slateInk)
                    if t != "10 PM" { Spacer() }
                }
            }
            .accessibilityHidden(true)

            ViewThatFits(in: .horizontal) {
                HStack(spacing: Tokens.Space.md) { legend }
                VStack(alignment: .leading, spacing: Tokens.Space.xxs) { legend }
            }
            .accessibilityHidden(true)
        }
    }

    @ViewBuilder private var legend: some View {
        ForEach(Array(marks.enumerated()), id: \.offset) { _, m in
            Label {
                Text("\(clock(m.at ?? "")) \(m.label ?? "")")
            } icon: {
                Circle().stroke(Tokens.ColorToken.deep, lineWidth: 1.5).frame(width: 8, height: 8)
            }
            .typeStyle(.caption)
            .foregroundStyle(Tokens.ColorToken.slateInk)
        }
        if !removed.isEmpty {
            Label {
                Text(Copy.arcRemoved)
            } icon: {
                RoundedRectangle(cornerRadius: 2).strokeBorder(Tokens.ColorToken.pause, style: StrokeStyle(lineWidth: 1, dash: [2, 2])).frame(width: 12, height: 8)
            }
            .typeStyle(.caption)
            .foregroundStyle(Tokens.ColorToken.slateInk)
        }
        if !paused.isEmpty {
            Label {
                Text(Copy.arcPaused)
            } icon: {
                RoundedRectangle(cornerRadius: 2).fill(Tokens.ColorToken.hairline).frame(width: 12, height: 8)
            }
            .typeStyle(.caption)
            .foregroundStyle(Tokens.ColorToken.slateInk)
        }
    }

    /// Split the line at each pause, so nothing is drawn across time that wasn't heard.
    private var segments: [[ArcPoint.Partial]] {
        var out: [[ArcPoint.Partial]] = [], current: [ArcPoint.Partial] = []
        for pt in points {
            current.append(pt)
            if (paused + removed).contains(where: { $0.from == pt.at }) {
                out.append(current)
                current = []
            }
        }
        if !current.isEmpty { out.append(current) }
        return out
    }

    static func minutes(_ at: String) -> Double {
        let parts = at.split(separator: ":").compactMap { Double($0) }
        return parts.count == 2 ? parts[0] * 60 + parts[1] : 0
    }

    /// Catmull-Rom through the points, as cubic Beziers.
    static func smooth(_ p: [CGPoint], into path: inout Path) {
        guard let first = p.first else { return }
        path.move(to: first)
        for i in 0..<max(p.count - 1, 0) {
            let p0 = i > 0 ? p[i - 1] : p[i], p1 = p[i], p2 = p[i + 1], p3 = i + 2 < p.count ? p[i + 2] : p2
            path.addCurve(
                to: p2,
                control1: CGPoint(x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6),
                control2: CGPoint(x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6)
            )
        }
    }
}
