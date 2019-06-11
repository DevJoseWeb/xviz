# ROS to XVIZ Custom Example

In order to provide the ability to take our ROS support beyond the basic
users need the ability to customize how ROS data is mapped into XVIZ.

Some reasons why a user may need to take control:
 - custom messages with message types we do not yet support
 - ROS data spread out across multiple topics
 - To create a fixed application with your UI & Configuration built-in

To make the use of ROS data as easy as possible, and offer as many options to a solution
this example demonstrates how to create both custom off-line conversion and a custom XVIZ Server
that is configured to handle your specific data.

# Quick start

## Convert KITTI data to a ROS Bag

To align with our other examples we take advanage of the same KITTI data set and use
the tools from https://github.com/tomas789/kitti2bag to convert the KITTI data into a ROS Bag.

Follow those instructions for your KITTI data to create the bag file.

If you have support for docker, the following should work with the KITTI data used in our default example.

```
xviz$ docker run -v `pwd`/data/kitti:/data -it tomas789/kitti2bag -t 2011_09_26 -r 0005 raw_synced
```

Note that the conversion only supports pose, point cloud, and camera images.

## Running the example

Setup XVIZ for running the example ROS converter.

```
xviz$ yarn bootstrap
xviz$ cd examples/converters/ros

xviz/examples/converters/ros$ yarn
xviz/examples/converters/ros$ yarn server -d ../../../data/kitti --rosConfig kitti.json
```

You should see `xvizserver-log: Listening on port 3000`

Next, lets use a test viewer in streetscape.gl to see the results.

In the streetscape.gl repo

```
streetscape.gl$ yarn bootstrap
streetscape.gl$ cd test/apps/viewer
streetscape.gl/test/apps/viewer$ yarn
streetscape.gl/test/apps/viewer$ yarn start-streaming-local
```

Navigate to the url and use the filename of the bag file as the path in the URL. Assuming the file
`kitti_2011_09_26_drive_0005_synced.bag`, then go to http://localhost:8080/kitti_2011_09_26_drive_0005_synced

## TODO describe what
