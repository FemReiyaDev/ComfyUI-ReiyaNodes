from .nodes import RMImageStitch

NODE_CLASS_MAPPINGS = {
    "RMImageStitch": RMImageStitch,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "RMImageStitch": "RM-ImageStitch",
}

WEB_DIRECTORY = "./web"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
