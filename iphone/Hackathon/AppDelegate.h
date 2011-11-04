//
//  AppDelegate.h
//  Hackathon
//
//  Created by Stephane JAIS on 11/4/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import <UIKit/UIKit.h>

@class CameraOverlayViewController;

@interface AppDelegate : UIResponder <UIApplicationDelegate>

@property (strong, nonatomic) UIWindow *window;

@property (strong, nonatomic) CameraOverlayViewController *viewController;

@end
