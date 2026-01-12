# ComfyUI-ReiyaNodes

Custom ComfyUI nodes for image stitching and variable management.

## Installation

1. Navigate to your ComfyUI `custom_nodes` directory
2. Clone or copy this repository:
   ```bash
   git clone https://github.com/FemReiyaDev/ComfyUI-ReiyaNodes.git
   ```
3. Restart ComfyUI

## Features

- **RMImageStitch**: Horizontally stitch multiple images together with dynamic input slots
- **GetNodeRM**: Custom Get node with left-side output for improved workflow organization

## Nodes

### RM-ImageStitch

Stitches multiple images together horizontally (side by side).

#### Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| num_images | INT | 3 | Number of images to stitch (2-10) |
| match_image_size | BOOLEAN | True | Resize images to match the height of the first image |
| image_1 | IMAGE | - | First image (required) |
| image_2 through image_10 | IMAGE | - | Additional images (optional, appears based on num_images) |

#### Outputs

| Name | Type | Description |
|------|------|-------------|
| IMAGE | IMAGE | The horizontally stitched image |

#### Behavior

- **Dynamic Inputs**: The node dynamically shows/hides image input slots based on the `num_images` parameter
- **Batch Handling**: Automatically matches batch sizes by repeating the last image from smaller batches
- **Size Matching**: When `match_image_size` is True, all images are resized to match the height of the first image while preserving aspect ratio
- **Channel Matching**: Automatically pads images with fewer channels to match the maximum number of channels (e.g., RGB to RGBA)
- **Ordering**: Images are arranged left-to-right: image_1 | image_2 | image_3 | ...

#### Technical Details

- **Upscale Method**: Uses Lanczos resampling for high-quality resizing
- **Batch Processing**: Supports batched images with different batch sizes
- **Channel Support**: Handles images with varying channel counts (1-4 channels)
- **Device**: Operates on the same device (CPU/GPU) as input images

#### Example Usage

1. Set `num_images` to the number of images you want to stitch (e.g., 3)
2. Connect your image outputs to `image_1`, `image_2`, and `image_3`
3. Adjust `match_image_size` to control whether images are resized to match heights
4. The node will output a single image with all input images stitched horizontally

### GetNodeRM

A modified Get node that outputs from the left side, improving workflow organization and visual clarity.

#### Features

- **Left-side Output**: Outputs appear on the left side of the node instead of the right
- **Auto-type Detection**: Automatically detects and matches the type from corresponding SetNode
- **Auto-coloring**: Automatically colors the node based on data type (when KJNodes auto-coloring is enabled)
- **Virtual Link Visualization**: Option to show/hide virtual connections to the corresponding SetNode
- **Navigation**: Right-click menu option to jump to the corresponding SetNode

#### Usage

1. Add a GetNodeRM to your graph
2. Select the variable name from the dropdown (must match a SetNode variable)
3. The node will automatically configure its output type to match the SetNode
4. Connect the left-side output to other nodes

#### Right-click Menu Options

- **Go to setter**: Centers the camera on the corresponding SetNode
- **Show/Hide connections**: Toggle visualization of virtual link to SetNode

#### Technical Details

- **Node Type**: Virtual node (does not impact the resulting prompt)
- **Compatibility**: Works with KJNodes SetNode
- **Color Mapping**: Supports all standard ComfyUI data type colors (MODEL, LATENT, IMAGE, etc.)
- **Output Direction**: Left (LiteGraph.LEFT)

## Technical Information

### Dependencies

- PyTorch
- ComfyUI
- LiteGraph.js (for UI components)

### File Structure

```
ComfyUI-ReiyaNodes/
├── __init__.py          # Node registration and mappings
├── nodes.py             # Python node implementations
├── pyproject.toml       # Project metadata
├── web/
│   └── js/
│       ├── rmImageStitch.js   # Dynamic input management for RMImageStitch
│       └── getnoderm.js       # GetNodeRM UI implementation
```

### Python API

#### RMImageStitch Class

```python
class RMImageStitch:
    MAX_IMAGES = 10
    RETURN_TYPES = ("IMAGE",)
    FUNCTION = "stitch"
    CATEGORY = "ReiyaNodes/image"
```

**Methods:**

- `INPUT_TYPES(cls)`: Defines input parameters and dynamic image slots
- `stitch(self, num_images, match_image_size, image_1, **kwargs)`: Main stitching function

#### Processing Pipeline

1. **Image Collection**: Gathers all provided images up to `num_images`
2. **Batch Normalization**: Matches all images to the largest batch size
3. **Size Normalization**: Optionally resizes images to match first image height
4. **Channel Normalization**: Pads images to match maximum channel count
5. **Concatenation**: Combines images horizontally along dimension 2

### JavaScript Extensions

#### RMImageStitch Extension

Manages dynamic input slot creation/removal based on `num_images` widget value.

**Key Functions:**
- `updateInputs()`: Adds or removes image input slots
- `nodeCreated()`: Initializes the node and sets up callbacks
- `loadedGraphNode()`: Restores correct input count when loading saved graphs

#### GetNodeRM Extension

Implements the custom Get node with left-side output.

**Key Features:**
- Custom node class extending `LGraphNode`
- Virtual node that doesn't affect prompt generation
- Dynamic type matching with SetNode
- Visual connection rendering

## License

MIT License

## Credits

- GetNodeRM is based on KJNodes SetGet by diffus3
