import SwiftUI

struct CreateCallView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.presentationMode) var presentationMode
    
    @State private var name = ""
    @State private var phone = ""
    @State private var assignee = ""
    @State private var notes = ""
    
    // Simplification: In real app use PhotosPicker
    @State private var hasAttachment = false 
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Details")) {
                    TextField("Name", text: $name)
                    TextField("Phone", text: $phone)
                        .keyboardType(.phonePad)
                    TextField("Assignee", text: $assignee)
                }
                
                Section(header: Text("Notes")) {
                    TextEditor(text: $notes)
                        .frame(height: 100)
                }
                
                Section {
                    Button(action: {
                        hasAttachment.toggle()
                    }) {
                        HStack {
                            Image(systemName: "paperclip")
                            Text(hasAttachment ? "Attachment Added" : "Add Attachment")
                                .foregroundColor(hasAttachment ? .green : .blue)
                        }
                    }
                }
            }
            .navigationTitle("New Call")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveCall()
                        presentationMode.wrappedValue.dismiss()
                    }
                    .disabled(name.isEmpty || phone.isEmpty)
                }
            }
        }
    }
    
    private func saveCall() {
        let newCall = Call(context: viewContext)
        newCall.id = UUID().uuidString
        newCall.name = name
        newCall.phone = phone
        newCall.assignee = assignee
        newCall.notes = notes
        newCall.status = "NEW"
        newCall.date = Date()
        newCall.createdAt = Date()
        newCall.needsSync = true
        
        try? viewContext.save()
    }
}
