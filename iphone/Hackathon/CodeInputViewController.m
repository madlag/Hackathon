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

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Custom initialization
    }
    return self;
}


#pragma mark - View lifecycle

- (void)viewDidLoad
{
    [super viewDidLoad];
    
    // Set up text field
    [self.textField becomeFirstResponder];
    self.textField.delegate = self;
    self.textField.returnKeyType = UIReturnKeyGo;

    // Title
    [self.navigationItem setTitle:NSLocalizedString(@"Enter Code", nil)];
}


#pragma mark - UITextFieldDelegate

- (BOOL)textFieldShouldReturn:(UITextField *)field {
    if (field == self.textField) {
        [self.delegate onEnterCode:textField.text];
    }
    return YES;
}

@end
