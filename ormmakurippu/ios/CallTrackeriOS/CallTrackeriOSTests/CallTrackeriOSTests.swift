import XCTest
@testable import CallTrackeriOS

class CallTrackeriOSViewModelTests: XCTestCase {

    var viewModel: CallViewModel!
    var context: NSManagedObjectContext!

    override func setUpWithError() throws {
        // Use in-memory store for testing
        let persistence = PersistenceController(inMemory: true)
        context = persistence.container.viewContext
        viewModel = CallViewModel(context: context)
    }

    func testAddCall() throws {
        // Given
        let name = "Test Call"
        
        // When
        viewModel.addCall(name: name, phone: "123", assignee: "Me", notes: "Test")
        
        // Then
        let fetchRequest: NSFetchRequest<Call> = Call.fetchRequest()
        let results = try context.fetch(fetchRequest)
        
        XCTAssertEqual(results.count, 1)
        XCTAssertEqual(results.first?.name, name)
        XCTAssertEqual(results.first?.status, "NEW")
    }
}
