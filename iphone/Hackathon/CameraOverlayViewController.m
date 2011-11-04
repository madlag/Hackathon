//
//  ViewController.m
//  Hackathon
//
//  Created by Stephane JAIS on 11/4/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import "CameraOverlayViewController.h"

@implementation CameraOverlayViewController
@synthesize imagePickerController;

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Release any cached data, images, etc that aren't in use.
}

#pragma mark - Camera

- (void)setupCamera {
    self.imagePickerController.showsCameraControls = NO;
    
    self.view.frame =  CGRectMake(0.0,436,320,44);
    self.imagePickerController.cameraOverlayView = self.view;
}

#pragma mark - IBActions

- (IBAction)takePicture:(id)sender {
    [self.imagePickerController takePicture];
    
}

- (IBAction)showActions:(id)sender {
    UIActionSheet *actionSheet = [[[UIActionSheet alloc] initWithTitle:nil delegate:self cancelButtonTitle:NSLocalizedString(@"Cancel", nil) destructiveButtonTitle:nil otherButtonTitles:NSLocalizedString(@"Choose from Library", nil), NSLocalizedString(@"Enter a new code", nil), nil] autorelease];
    [actionSheet showFromToolbar:(UIToolbar*)self.view];
    
}
#pragma mark - Action sheet

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex {
    switch (buttonIndex) {
        case 0:
            NSLog(@"Choose from library");
            break;
        case 1:
            NSLog(@"Enter code");
            break;
        default:
            break;
    }
}

#pragma mark - View lifecycle

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    if ((self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil]))
    {
        self.imagePickerController = [[[UIImagePickerController alloc] init] autorelease];
        self.imagePickerController.sourceType = UIImagePickerControllerSourceTypeCamera;
        self.imagePickerController.delegate = (id)self;
        [self setupCamera];
    }
    return self;
}


- (void)viewDidLoad
{
    [super viewDidLoad];
	// Do any additional setup after loading the view, typically from a nib.
}

- (void)viewDidUnload
{
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (void)viewWillAppear:(BOOL)animated
{
    [super viewWillAppear:animated];
}

- (void)viewDidAppear:(BOOL)animated
{
    [super viewDidAppear:animated];
}

- (void)viewWillDisappear:(BOOL)animated
{
	[super viewWillDisappear:animated];
}

- (void)viewDidDisappear:(BOOL)animated
{
	[super viewDidDisappear:animated];
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    // Return YES for supported orientations
    if ([[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPhone) {
        return (interfaceOrientation != UIInterfaceOrientationPortraitUpsideDown);
    } else {
        return YES;
    }
}

#pragma mark - UIImagePicker

- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary *)info {
    NSLog(@"%@", info);
}

@end
