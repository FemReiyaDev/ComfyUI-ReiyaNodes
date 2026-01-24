import torch
from comfy.utils import common_upscale


class ReiImageStitch:
    MAX_IMAGES = 10

    @classmethod
    def INPUT_TYPES(s):
        inputs = {
            "required": {
                "num_images": (
                    "INT",
                    {"default": 3, "min": 2, "max": s.MAX_IMAGES, "step": 1},
                ),
                "match_image_size": ("BOOLEAN", {"default": True}),
                "image_1": ("IMAGE",),
            },
            "optional": {},
        }
        # Add optional image inputs for slots 2 through MAX_IMAGES
        for i in range(2, s.MAX_IMAGES + 1):
            inputs["optional"][f"image_{i}"] = ("IMAGE",)
        return inputs

    RETURN_TYPES = ("IMAGE",)
    FUNCTION = "stitch"
    CATEGORY = "ReiyaNodes/image"
    DESCRIPTION = """
Stitches multiple images together horizontally (side by side).
Set num_images to specify how many images to use (2-10).
Images are placed left to right: image_1 | image_2 | image_3 | ...
"""

    def stitch(self, num_images, match_image_size, image_1, **kwargs):
        # Collect all provided images
        images = [image_1]
        for i in range(2, num_images + 1):
            img = kwargs.get(f"image_{i}")
            if img is not None:
                images.append(img)
            else:
                # If an image slot is missing, skip it
                break

        if len(images) < 2:
            return (image_1,)

        # Handle batch size differences - match to largest batch
        batch_sizes = [img.shape[0] for img in images]
        max_batch = max(batch_sizes)

        processed_images = []
        for img in images:
            if img.shape[0] < max_batch:
                repeats = max_batch - img.shape[0]
                last_image = img[-1].unsqueeze(0).repeat(repeats, 1, 1, 1)
                img = torch.cat([img.clone(), last_image], dim=0)
            processed_images.append(img)

        # Resize images to match height of first image if needed
        if match_image_size:
            target_height = processed_images[0].shape[1]
            resized_images = [processed_images[0]]

            for img in processed_images[1:]:
                orig_height = img.shape[1]
                orig_width = img.shape[2]
                aspect_ratio = orig_width / orig_height
                target_width = int(target_height * aspect_ratio)

                img_for_upscale = img.movedim(-1, 1)  # B, H, W, C -> B, C, H, W
                img_resized = common_upscale(
                    img_for_upscale, target_width, target_height, "lanczos", "disabled"
                )
                img_resized = img_resized.movedim(1, -1)  # B, C, H, W -> B, H, W, C
                resized_images.append(img_resized)

            processed_images = resized_images

        # Ensure all images have the same number of channels
        channels = [img.shape[-1] for img in processed_images]
        max_channels = max(channels)

        final_images = []
        for img in processed_images:
            if img.shape[-1] < max_channels:
                alpha = torch.ones(
                    (*img.shape[:-1], max_channels - img.shape[-1]), device=img.device
                )
                img = torch.cat((img, alpha), dim=-1)
            final_images.append(img)

        # Concatenate horizontally (along width, dim=2)
        stitched = torch.cat(final_images, dim=2)

        return (stitched,)
