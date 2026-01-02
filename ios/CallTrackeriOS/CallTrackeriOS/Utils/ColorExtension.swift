import SwiftUI

extension Color {
    static var statusNew: Color { Color.blue }
    static var statusSent: Color { Color.green }
    static var statusDone: Color { Color.gray }
    
    static func from(status: String) -> Color {
        switch status {
        case "NEW": return .statusNew
        case "SENT": return .statusSent
        case "DONE": return .statusDone
        default: return .primary
        }
    }
}
