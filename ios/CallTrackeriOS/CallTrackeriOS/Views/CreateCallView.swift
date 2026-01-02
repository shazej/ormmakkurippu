import SwiftUI
import PhotosUI

struct CreateCallView: View {
    @ObservedObject var viewModel: CallViewModel
    @Environment(\.presentationMode) var presentationMode
    
    @State private var name = ""
    @State private var phone = ""
    @State private var assignee = ""
    @State private var notes = ""
    
    @State private var selectedItem: PhotosPickerItem? = nil
    @State private var selectedImage: UIImage? = nil
    
    var body: some View {
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
            
            Section(header: Text("Attachment")) {
                if let image = selectedImage {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .frame(height: 200)
                }
                
                PhotosPicker(
                    selection: $selectedItem,
                    matching: .images,
                    photoLibrary: .shared()) {
                        HStack {
                            Image(systemName: "photo")
                            Text("Select Photo")
                        }
                    }
                    .onChange(of: selectedItem) { newItem in
                        Task {
                            if let data = try? await newItem?.loadTransferable(type: Data.self),
                               let uiImage = UIImage(data: data) {
                                selectedImage = uiImage
                            }
                        }
                    }
            }
            
            if viewModel.isLoading {
                HStack {
                    Spacer()
                    ProgressView()
                    Spacer()
                }
            }
            
            Button(action: saveCall) {
                Text("Save Call")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isValid ? Color.blue : Color.gray)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            .disabled(!isValid || viewModel.isLoading)
        }
        .navigationTitle("New Call")
        .alert(item: Binding<AlertItem?>(
            get: { viewModel.errorMessage.map { AlertItem(message: $0) } },
            set: { _ in viewModel.errorMessage = nil }
        )) { item in
            Alert(title: Text("Error"), message: Text(item.message), dismissButton: .default(Text("OK")))
        }
    }
    
    var isValid: Bool {
        !name.isEmpty && !phone.isEmpty
    }
    
    func saveCall() {
        viewModel.addCall(name: name, phone: phone, assignee: assignee, notes: notes, attachment: selectedImage)
        presentationMode.wrappedValue.dismiss()
    }
}

struct AlertItem: Identifiable {
    let id = UUID()
    let message: String
}
