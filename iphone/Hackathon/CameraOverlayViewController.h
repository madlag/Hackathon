//
//  ViewController.h
//  Hackathon
//
//  Created by Stephane JAIS on 11/4/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface CameraOverlayViewController : UIViewController <UIImagePickerControllerDelegate, UIActionSheetDelegate>
{
    UIImagePickerController *imagePickerController;
}

- (IBAction)showActions:(id)sender;
- (IBAction)takePicture:(id)sender;

@property (nonatomic, retain) UIImagePickerController *imagePickerController;

@end
