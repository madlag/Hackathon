//
//  MainViewController.m
//  Hackathon
//
//  Created by Alexis Taugeron on 11/5/11.
//  Copyright (c) 2011 Cantina Software. All rights reserved.
//

#import "MainViewController.h"

@interface MainViewController()
-(void)showCamera;
@end


@implementation MainViewController

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Set up the upload controller
        uploadController = [[UploadController alloc] init];
        
        // Set up the camera
        [self setupCamera];
    }
    return self;
}

- (void)didReceiveMemoryWarning
{
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc that aren't in use.
}

-(void)dealloc {
    [uploadController release];
    [camera release];
    [super dealloc];
}

#pragma mark - View lifecycle

/*
// Implement loadView to create a view hierarchy programmatically, without using a nib.
- (void)loadView
{
}
*/

/*
// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
- (void)viewDidLoad
{
    [super viewDidLoad];
}
*/

- (void)viewDidUnload
{
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    // Return YES for supported orientations
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}


#pragma mark CodeInputViewControllerDelegate

-(void)onEnterCode:(NSString *)code {
    
    // Display a new camera view
    [self showCamera];
    
    // Save the code
    [uploadController performSelectorInBackground:@selector(setChannelId:) withObject:code];
    
}


#pragma mark Camera

-(void)setupCamera {
    camera = [[UIImagePickerController alloc] init];
    camera.sourceType = UIImagePickerControllerSourceTypeCamera;
    camera.delegate = self;   
}

-(void)showCamera {
    [self presentModalViewController:camera animated:NO];
}


#pragma mark UIImagePickerControllerDelegate

-(void)imagePickerController:(UIImagePickerController *)picker didFinishPickingImage:(UIImage *)image editingInfo:(NSDictionary *)editingInfo {
    [uploadController addPictureToUpload:image];
    
    UIImagePickerController *oldCamera = camera;
    [oldCamera dismissModalViewControllerAnimated:NO];
    [oldCamera release];
    [self setupCamera];
    [self showCamera];
}

@end
