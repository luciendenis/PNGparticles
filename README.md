# PNGparticles
Fun javascript project to generate particles from a png animation.

This code is a javascript particles generator, it maps images (png in this case) to create particles. You can uses several
images to create an animation that you can tune afterwards. I've done it for a flying bird and a running wolf so far, but
you can really put any images in the folder to play with, as long as you fill the variables in the js file accordingly.

In the html file, everything in the div "interface" is made to play with parameters, until you find the ones that fits your
project.
In the css file, everthing below the canvas settings serves the presentation of the parameters interface, and can be deleted
when you found the right settings and do not wish to play with them anymore.

In the js file, the following variables should be updated if you change the images :
- frameChoice: the path to the folder that contains your images.
- frameExtension: the extension of your images.
- frameNumber: the number of images you put in the folder.
- frameWidth, frameHeight: the width and height of the images you put in the folder.

The images in the folder should be named 0.png, 1.png, 2.png, etc... in the order they are supposed to be read.
Careful if you're working localy, you may have trouble with the CORS settings, that won't let the animation play due to
tainted canvas.
