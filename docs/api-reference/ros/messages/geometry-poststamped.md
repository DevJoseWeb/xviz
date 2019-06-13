# GeometryPoseStamped

[geometry_msgs/PoseStamped](http://docs.ros.org/api/geometry_msgs/html/msg/PoseStamped.html)

This converter uses the message field `pose` to define an XVIZ Pose.

It the ROSBag implementation was able to provide an `origin` then this
converter will use that for the `mapOrigin` on the XVIZPose stream.

## Options

- `origin` (Object) - Defines geospatial `mapOrigin` used for the relative position extracted from the ROS message.

## Metadata

Defines the XVIZ Stream with the category 'pose'
