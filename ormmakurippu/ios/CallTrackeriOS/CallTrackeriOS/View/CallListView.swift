import SwiftUI
import CoreData

struct CallListView: View {
    @Environment(\.managedObjectContext) private var viewContext
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Call.date, ascending: false)],
        animation: .default)
    private var calls: FetchedResults<Call>
    
    @State private var searchText = ""
    @State private var statusFilter: String? = nil
    
    var filteredCalls: [Call] {
        calls.filter { call in
            let matchesSearch = searchText.isEmpty || 
                (call.name?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                (call.phone?.localizedCaseInsensitiveContains(searchText) ?? false)
            
            let matchesStatus = statusFilter == nil || call.status == statusFilter
            
            return matchesSearch && matchesStatus
        }
    }
    
    var body: some View {
        List {
            ForEach(filteredCalls, id: \.self) { call in
                NavigationLink(destination: CallDetailView(call: call)) {
                    VStack(alignment: .leading) {
                        Text(call.name ?? "Unknown")
                            .font(.headline)
                        HStack {
                            Text(call.phone ?? "")
                            Spacer()
                            Text(call.status ?? "")
                                .foregroundColor(statusColor(call.status))
                        }
                        .font(.subheadline)
                    }
                }
                .swipeActions(edge: .trailing) {
                    Button(role: .destructive) {
                        deleteCall(call)
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                }
                .swipeActions(edge: .leading) {
                    if call.status != "SENT" {
                        Button {
                            updateStatus(call, "SENT")
                        } label: {
                            Label("Sent", systemImage: "paperplane")
                        }
                        .tint(.green)
                    }
                }
            }
        }
        .searchable(text: $searchText)
        .navigationTitle("Calls")
    }
    
    private func deleteCall(_ call: Call) {
        viewContext.delete(call)
        try? viewContext.save()
    }
    
    private func updateStatus(_ call: Call, _ status: String) {
        call.status = status
        call.needsSync = true
        try? viewContext.save()
    }
    
    private func statusColor(_ status: String?) -> Color {
        switch status {
        case "NEW": return .blue
        case "SENT": return .green
        case "DONE": return .gray
        default: return .black
        }
    }
}
