//
//  CodeInputViewController.m
//  Hackathon
//
//  Created by Stephane JAIS on 11/5/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import "CodeInputViewController.h"
#import "SBJson.h"
#import "UIImageExtensions.h"

@implementation CodeInputViewController
@synthesize textField, delegate;


#pragma mark - View lifecycle

- (void)viewDidLoad
{
    [super viewDidLoad];
    
    // Set the screen title
    [self.navigationItem setTitle:NSLocalizedString(@"Enter Code", nil)];
    
    // Focus on the text field
    [self.textField becomeFirstResponder];
    
    // Pre-fill with the last code if possible
    NSString *lastCode = [[NSUserDefaults standardUserDefaults] stringForKey:@"code"];
    if (lastCode && [lastCode length] > 0) {
        self.textField.text = lastCode;
    }
}


#pragma mark - UITextFieldDelegate

- (BOOL)textFieldShouldReturn:(UITextField *)field
{
    if (field == self.textField) {
        [self.delegate onEnterCode:textField.text];
    }
    
    return YES;
}

@end
