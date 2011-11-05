//
//  MainViewController.h
//  Hackathon
//
//  Created by Alexis Taugeron on 11/5/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "CodeInputViewController.h"
#import "UploadController.h"

@interface MainViewController : UINavigationController <UIImagePickerControllerDelegate,CodeInputViewControllerDelegate> {
    UploadController *uploadController;
    UIImagePickerController *camera;
}

@end
