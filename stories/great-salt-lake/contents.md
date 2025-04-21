# Computing the area of Great Salt Lake over time
## some subtitle info 
Author: Raj Saha, PhD

In this project we use Google Earth Timelapse images between 1985 and 2022 to compute the area of Great Salt Lake over time. We primarily use python's OpenCV library to extract the lake's boundaries from the images and then compute the area of the lake. In this short article, we will discuss the process.

### Channel Selection
The original image has Red, Green and Blue Channels. We need to select the channel that has the highest contrast between the lake and the surrounding land. We do sort of manually given that we only have 3 channels to choose from and no near infrared. We find that the blue channel has the highest contrast between the lake and the surrounding land. We extract the blue channel from the original image and save the images.

### Baseline Year and Lake Boundaries
1985 being the first year of our images, we select it as our baseline year. Then we apply thresholding to the blue channel to get the lake's boundaries. Again, this step is done manually. If we have access to more information such as a digital elevation models, we can use it to automatically determine the lake's boundaries.

Once we have determined a suitable threshold, then we create a mask for the lake's boundaries in 1985. We then use this mask to extract the lake's boundaries from the original set of images.

### Computing the area
Applying the mask to the images now gives us the lake's boundaries for each year. Within the mask, we now find the lake boundaries for each image from each year. In practice it is actually easier to find the exposed land boundaries as they tend to be closed polygons. By subtracting the total area of the exposed land from the total area of the lake in 1985, we can get the area of the lake for each year.

### Applying boundaries to the images
To show explicitly how the boundaries have changed over time, we apply the boundaries from our blue channel onto the original images.


