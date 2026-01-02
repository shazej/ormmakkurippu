import SwiftUI
import CoreData

struct CallDetailView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @ObservedObject var call: Call
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                DetailRow(label: "Name", value: call.name)
                DetailRow(label: "Phone", value: call.phone)
                DetailRow(label: "Assignee", value: call.assignee)
                DetailRow(label: "Status", value: call.status)
                DetailRow(label: "Date", value: call.date?.description)
                
                if let notes = call.notes, !notes.isEmpty {
                    VStack(alignment: .leading) {
                        Text("Notes")
                            .font(.caption)
                            .foregroundColor(.gray)
                        Text(notes)
                            .font(.body)
                    }
                }
                
                Divider()
                
                HStack {
                    Button(action: { updateStatus("SENT") }) {
                        Text("Mark Sent")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(call.status == "SENT" ? Color.gray : Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                    .disabled(call.status == "SENT")
                    
                    Button(action: { updateStatus("DONE") }) {
                        Text("Mark Done")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(call.status == "DONE" ? Color.gray : Color.green)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                    .disabled(call.status == "DONE")
                }
            }
            .padding()
        }
        .navigationTitle("Details")
    }
    
    private func updateStatus(_ status: String) {
        call.status = status
        call.needsSync = true
        try? viewContext.save()
    }
}

struct DetailRow: View {
    let label: String
    let value: String?
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(label)
                .font(.caption)
                .foregroundColor(.gray)
            Text(value ?? "-")
                .font(.title3)
        }
    }
}
