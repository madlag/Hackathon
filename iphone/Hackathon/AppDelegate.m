//
//  AppDelegate.m
//  Hackathon
//
//  Created by Stephane JAIS on 11/4/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import "AppDelegate.h"
#import "CodeInputViewController.h"
#import "MainViewController.h"

@implementation AppDelegate

@synthesize window = _window;
@synthesize navigationController = _navigationController;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    self.window = [[UIWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]];
    // Override point for customization after application launch.
    if ([[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPhone) {
        
        // Load the main view controller and the code input screen
        CodeInputViewController *codeInputViewController = [[CodeInputViewController alloc] initWithNibName:@"CodeInputViewController" bundle:nil];
        MainViewController *mainViewController = [[MainViewController alloc] initWithRootViewController:codeInputViewController];
        codeInputViewController.delegate = mainViewController;
        
        self.window.rootViewController = mainViewController;
        
        [codeInputViewController release];
        [mainViewController release];
        
    } else {
    }
    [self.window makeKeyAndVisible];
    return YES;
}
@end
