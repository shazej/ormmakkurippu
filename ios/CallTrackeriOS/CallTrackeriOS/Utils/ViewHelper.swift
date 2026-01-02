import Foundation
import UIKit

extension UIApplication {
    var topViewController: UIViewController? {
        // Handle multiple scenes
        guard let windowScene = connectedScenes.first as? UIWindowScene,
              let root = windowScene.windows.first(where: { $0.isKeyWindow })?.rootViewController ?? windowScene.windows.first?.rootViewController else {
            return nil
        }
        return getTopViewController(from: root)
    }

    private func getTopViewController(from root: UIViewController) -> UIViewController {
        if let presented = root.presentedViewController {
            return getTopViewController(from: presented)
        }
        if let nav = root as? UINavigationController, let last = nav.viewControllers.last {
            return getTopViewController(from: last)
        }
        if let tab = root as? UITabBarController, let selected = tab.selectedViewController {
            return getTopViewController(from: selected)
        }
        return root
    }
}
