import os

def configure():
    gradle_path = "android/app/build.gradle"
    if os.path.exists(gradle_path):
        with open(gradle_path, "r", encoding="utf-8") as f:
            c = f.read()

        if "coreLibraryDesugaring" not in c:
            c = c.replace(
                "compileOptions {",
                "compileOptions {\n        coreLibraryDesugaringEnabled true"
            )
            c = c.replace(
                "defaultConfig {",
                "defaultConfig {\n        multiDexEnabled true\n        minSdkVersion 23"
            )
            c = c.replace(
                "dependencies {",
                'dependencies {\n    coreLibraryDesugaring "com.android.tools:desugar_jdk_libs:2.0.4"\n    implementation "androidx.multidex:multidex:2.0.1"'
            )

        with open(gradle_path, "w", encoding="utf-8") as f:
            f.write(c)
        print("Updated android/app/build.gradle successfully.")

    manifest_path = "android/app/src/main/AndroidManifest.xml"
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            m = f.read()

        perms = """
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
"""
        if "POST_NOTIFICATIONS" not in m:
            m = m.replace("<application", perms + "\n    <application")
        if "usesCleartextTraffic" not in m:
            m = m.replace("<application", '<application android:usesCleartextTraffic="true"')
        if 'android:label="' in m:
            import re
            m = re.sub(r'android:label="[^"]*"', 'android:label="Golden Bloom CRM"', m)

        with open(manifest_path, "w", encoding="utf-8") as f:
            f.write(m)
        print("Updated AndroidManifest.xml successfully.")

if __name__ == "__main__":
    configure()
